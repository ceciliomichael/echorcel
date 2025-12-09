import { getDeploymentsCollection, getBuildsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { execSync } from "child_process";
import {
  cloneRepository,
  detectFramework,
  buildImage,
  createAndStartContainer,
  stopContainer,
  removeContainer,
} from "@/lib/docker";
import { FRAMEWORK_PRESETS, Deployment, DeploymentStatus } from "@/types/deployment";
import { getAdmin } from "@/lib/auth";
import { decryptToken } from "@/lib/github";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const ROUTER_DOMAIN = process.env.ROUTER_DOMAIN || "";
const IS_TUNNEL_MODE = Boolean(ROUTER_DOMAIN);

function generateHostname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueHostname(baseName: string, deploymentId: string): Promise<string> {
  const baseSlug = generateHostname(baseName) || "app";
  const collection = await getDeploymentsCollection();

  const existing = await collection
    .find({ hostname: { $regex: `^${baseSlug}(?:-[0-9]+)?\\.${ROUTER_DOMAIN}$` } })
    .project<{ hostname?: string }>({ hostname: 1 })
    .toArray();

  if (existing.length === 0) {
    return `${baseSlug}.${ROUTER_DOMAIN}`;
  }

  const usedSuffixes = new Set<number>();

  for (const doc of existing) {
    if (!doc.hostname) continue;
    const withoutDomain = doc.hostname.replace(`.${ROUTER_DOMAIN}`, "");
    if (withoutDomain === baseSlug) {
      usedSuffixes.add(0);
      continue;
    }

    const match = withoutDomain.match(new RegExp(`^${baseSlug}-([0-9]+)$`));
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (!Number.isNaN(num)) {
        usedSuffixes.add(num);
      }
    }
  }

  let suffix = 1;
  while (usedSuffixes.has(suffix)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}.${ROUTER_DOMAIN}`;
}

async function updateDeploymentStatus(
  id: string,
  status: DeploymentStatus,
  additionalData: Partial<Deployment> = {}
) {
  const collection = await getDeploymentsCollection();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        ...additionalData,
        updatedAt: new Date(),
      },
    }
  );
}

async function appendLog(id: string, log: string) {
  const collection = await getDeploymentsCollection();
  const logEntry = `[${new Date().toISOString()}] ${log}`;
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $push: { logs: logEntry } as any,
      $set: { updatedAt: new Date() },
    }
  );
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
}

function getCommitInfo(repoPath: string): CommitInfo {
  try {
    const sha = execSync("git rev-parse HEAD", { cwd: repoPath, encoding: "utf-8" }).trim();
    const message = execSync("git log -1 --pretty=%s", { cwd: repoPath, encoding: "utf-8" }).trim();
    const author = execSync("git log -1 --pretty=%an", { cwd: repoPath, encoding: "utf-8" }).trim();
    return { sha, message, author };
  } catch (_error) {
    return { sha: "unknown", message: "Initial deployment", author: "Unknown" };
  }
}

export async function triggerDeploy(
  deploymentId: string,
  trigger: "manual" | "webhook" | "rollback" = "manual"
): Promise<{ success: boolean; message: string }> {
  try {
    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({ _id: new ObjectId(deploymentId) });

    if (!deployment) {
      return { success: false, message: "Deployment not found" };
    }

    // Clear old logs and set status to pending
    await collection.updateOne(
      { _id: new ObjectId(deploymentId) },
      {
        $set: {
          status: "pending",
          logs: [],
          updatedAt: new Date(),
        },
      }
    );

    // Start deployment process in background (don't await)
    runDeployment(deploymentId, deployment as unknown as Deployment, trigger).catch((err) => {
      console.error("Deploy error:", err);
    });

    return { success: true, message: "Deployment started" };
  } catch (error) {
    console.error("Failed to trigger deployment:", error);
    return { success: false, message: "Failed to trigger deployment" };
  }
}

async function runDeployment(
  id: string,
  deployment: Deployment,
  trigger: "manual" | "webhook" | "rollback" = "manual"
) {
  const tempDir = path.join(os.tmpdir(), `echorcel-${id}-${Date.now()}`);
  const startTime = Date.now();
  let buildId: ObjectId | null = null;

  const logHandler = async (log: string) => {
    await appendLog(id, log);
  };

  try {
    // Step 0: Stop and remove existing container if redeploying
    if (deployment.containerId) {
      await logHandler("Stopping existing container...");
      await stopContainer(deployment.containerId);
      await removeContainer(deployment.containerId);
      await logHandler("Existing container removed");
    }

    await updateDeploymentStatus(id, "cloning");
    await logHandler(`Cloning repository: ${deployment.gitUrl}`);

    let cloneUrl = deployment.gitUrl;

    try {
      const parsed = new URL(deployment.gitUrl);
      if (parsed.hostname === "github.com") {
        const admin = await getAdmin();
        if (admin?.github?.accessToken) {
          const token = decryptToken(admin.github.accessToken);
          parsed.username = "x-access-token";
          parsed.password = token;
          cloneUrl = parsed.toString();
        }
      }
    } catch (_error) {}

    await cloneRepository(cloneUrl, deployment.branch, tempDir);
    await logHandler("Repository cloned successfully");

    // Get commit info after cloning
    const commitInfo = getCommitInfo(tempDir);
    await logHandler(`Commit: ${commitInfo.sha.slice(0, 7)} - ${commitInfo.message}`);

    // Create build record
    const buildsCollection = await getBuildsCollection();
    const buildCount = await buildsCollection.countDocuments({ deploymentId: new ObjectId(id) });

    const buildResult = await buildsCollection.insertOne({
      deploymentId: new ObjectId(id),
      buildNumber: buildCount + 1,
      status: "building",
      branch: deployment.branch,
      commit: commitInfo,
      trigger,
      isCurrent: false,
      logs: [],
      createdAt: new Date(),
    });
    buildId = buildResult.insertedId;

    // Step 2: Detect framework if not specified
    const workDir = deployment.rootDirectory
      ? path.join(tempDir, deployment.rootDirectory)
      : tempDir;

    let framework = deployment.framework;
    if (!framework || framework === "dockerfile") {
      const detected = detectFramework(workDir);
      framework = detected;
      await logHandler(`Auto-detected framework: ${FRAMEWORK_PRESETS[detected].name}`);

      // Update deployment with detected framework settings
      const preset = FRAMEWORK_PRESETS[detected];
      const collection = await getDeploymentsCollection();
      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            framework: detected,
            buildCommand: deployment.buildCommand || preset.buildCommand,
            outputDirectory: deployment.outputDirectory || preset.outputDir,
            installCommand: deployment.installCommand || preset.installCommand,
            startCommand: deployment.startCommand || preset.startCommand,
          },
        }
      );
    }

    // Step 3: Build Docker image
    await updateDeploymentStatus(id, "building");
    await logHandler("Building Docker image...");

    const updatedDeployment = (await (
      await getDeploymentsCollection()
    ).findOne({ _id: new ObjectId(id) })) as unknown as Deployment;

    const imageName = await buildImage(updatedDeployment, tempDir, logHandler);
    await logHandler(`Docker image built: ${imageName}`);

    // Step 4: Start container
    await logHandler("Starting container...");
    const containerId = await createAndStartContainer(
      updatedDeployment,
      imageName,
      logHandler
    );

    // Generate hostname for public access (only when router domain is configured)
    let hostname: string | undefined;
    let publicUrl: string | undefined;

    if (IS_TUNNEL_MODE) {
      // Reuse existing hostname if available (for redeployments), otherwise generate new one
      hostname = updatedDeployment.hostname || (await generateUniqueHostname(updatedDeployment.name, id));
      publicUrl = `https://${hostname}`;
    }

    // Update deployment with container info
    await updateDeploymentStatus(id, "running", {
      containerId,
      imageId: imageName,
      previewUrl: `http://localhost:${updatedDeployment.port}`,
      ...(hostname ? { hostname } : {}),
      ...(publicUrl ? { publicUrl } : {}),
    });

    // Mark all previous builds as not current, then set this one as current
    if (buildId) {
      const buildsCollection = await getBuildsCollection();
      await buildsCollection.updateMany(
        { deploymentId: new ObjectId(id), isCurrent: true },
        { $set: { isCurrent: false } }
      );
      await buildsCollection.updateOne(
        { _id: buildId },
        {
          $set: {
            status: "ready",
            isCurrent: true,
            containerId,
            imageId: imageName,
            duration: Math.round((Date.now() - startTime) / 1000),
            finishedAt: new Date(),
          },
        }
      );
    }

    await logHandler(`Deployment successful!`);
    await logHandler(`Local: http://localhost:${updatedDeployment.port}`);
    if (publicUrl) {
      await logHandler(`Public: ${publicUrl}`);
    } else {
      await logHandler("Public URL not configured (no ROUTER_DOMAIN set)");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logHandler(`Deployment failed: ${errorMessage}`);
    await updateDeploymentStatus(id, "failed");

    // Update build record as failed
    if (buildId) {
      const buildsCollection = await getBuildsCollection();
      await buildsCollection.updateOne(
        { _id: buildId },
        {
          $set: {
            status: "failed",
            duration: Math.round((Date.now() - startTime) / 1000),
            finishedAt: new Date(),
          },
        }
      );
    }
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  }
}
