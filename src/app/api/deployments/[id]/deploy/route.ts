import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  cloneRepository,
  detectFramework,
  buildImage,
  createAndStartContainer,
} from "@/lib/docker";
import { FRAMEWORK_PRESETS, Deployment, DeploymentStatus } from "@/types/deployment";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({ _id: new ObjectId(id) });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Start deployment process in background
    deployAsync(id, deployment as unknown as Deployment).catch(console.error);

    return NextResponse.json({ message: "Deployment started", id });
  } catch (error) {
    console.error("Failed to start deployment:", error);
    return NextResponse.json(
      { error: "Failed to start deployment" },
      { status: 500 }
    );
  }
}

async function deployAsync(id: string, deployment: Deployment) {
  const tempDir = path.join(os.tmpdir(), `echorcel-${id}-${Date.now()}`);

  const logHandler = async (log: string) => {
    await appendLog(id, log);
  };

  try {
    // Step 1: Clone repository
    await updateDeploymentStatus(id, "cloning");
    await logHandler(`Cloning repository: ${deployment.gitUrl}`);

    await cloneRepository(deployment.gitUrl, deployment.branch, tempDir);
    await logHandler("Repository cloned successfully");

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

    // Update deployment with container info
    await updateDeploymentStatus(id, "running", {
      containerId,
      imageId: imageName,
      previewUrl: `http://localhost:${updatedDeployment.port}`,
    });

    await logHandler(`Deployment successful! Available at http://localhost:${updatedDeployment.port}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logHandler(`Deployment failed: ${errorMessage}`);
    await updateDeploymentStatus(id, "failed");
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  }
}
