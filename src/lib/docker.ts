import Docker from "dockerode";
import { Deployment, FrameworkPreset } from "@/types/deployment";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";

const execAsync = promisify(exec);

/**
 * Auto-detect Docker connection based on platform and environment
 */
function createDockerClient(): Docker {
  // If DOCKER_HOST is explicitly set, use it
  if (process.env.DOCKER_HOST) {
    const host = process.env.DOCKER_HOST;
    
    if (host.startsWith("tcp://")) {
      const url = new URL(host.replace("tcp://", "http://"));
      return new Docker({
        host: url.hostname,
        port: parseInt(url.port) || 2375,
      });
    }
    
    if (host.startsWith("unix://")) {
      return new Docker({ socketPath: host.replace("unix://", "") });
    }
    
    if (host.startsWith("npipe://")) {
      return new Docker({ socketPath: host.replace("npipe://", "") });
    }
  }

  const platform = os.platform();

  // Windows: Try named pipe first, then TCP
  if (platform === "win32") {
    const windowsPipe = "//./pipe/docker_engine";
    try {
      // Check if the named pipe exists
      if (fs.existsSync(windowsPipe)) {
        return new Docker({ socketPath: windowsPipe });
      }
    } catch (_error) {
      // Pipe doesn't exist or not accessible
    }
    
    // Fall back to TCP (Docker Desktop default when exposed)
    return new Docker({ host: "localhost", port: 2375 });
  }

  // Linux/macOS: Use Unix socket
  const unixSocket = "/var/run/docker.sock";
  if (fs.existsSync(unixSocket)) {
    return new Docker({ socketPath: unixSocket });
  }

  // Fallback: Let Dockerode use its default detection
  return new Docker();
}

const docker = createDockerClient();

export async function testDockerConnection(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch (_error) {
    return false;
  }
}

export async function cloneRepository(
  gitUrl: string,
  branch: string,
  targetDir: string
): Promise<void> {
  const cloneCommand = `git clone --branch ${branch} --depth 1 ${gitUrl} "${targetDir}"`;
  await execAsync(cloneCommand);
}

export function detectFramework(repoPath: string): FrameworkPreset {
  const packageJsonPath = path.join(repoPath, "package.json");
  const dockerfilePath = path.join(repoPath, "Dockerfile");
  const dockerComposePath = path.join(repoPath, "docker-compose.yml");
  const dockerComposeYamlPath = path.join(repoPath, "docker-compose.yaml");

  if (fs.existsSync(dockerComposePath) || fs.existsSync(dockerComposeYamlPath)) {
    return "docker-compose";
  }

  if (fs.existsSync(dockerfilePath)) {
    return "dockerfile";
  }

  if (!fs.existsSync(packageJsonPath)) {
    return "static";
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps["next"]) return "nextjs";
    if (deps["nuxt"]) return "nuxt";
    if (deps["@angular/core"]) return "angular";
    if (deps["svelte"] || deps["@sveltejs/kit"]) return "svelte";
    if (deps["vue"]) return "vue";
    if (deps["@nestjs/core"]) return "nestjs";
    if (deps["express"]) return "express";
    if (deps["react"]) return "react";
  } catch (_error) {
    // ignore parse errors
  }

  return "static";
}

export function generateDockerfile(
  framework: FrameworkPreset,
  buildCommand: string,
  installCommand: string,
  startCommand: string,
  outputDir: string,
  port: number,
  envVariables: { key: string; value: string }[] = []
): string {
  const nodeVersion = "20-alpine";
  
  // Generate ARG and ENV lines for build-time variables
  const buildEnvArgs = envVariables.map((e) => `ARG ${e.key}`).join("\n");
  const buildEnvSet = envVariables.map((e) => `ENV ${e.key}=\${${e.key}}`).join("\n");

  switch (framework) {
    case "nextjs":
      return `FROM node:${nodeVersion} AS builder
WORKDIR /app
${buildEnvArgs ? buildEnvArgs + "\n" : ""}${buildEnvSet ? buildEnvSet + "\n" : ""}COPY package*.json ./
RUN ${installCommand || "npm install"}
COPY . .
RUN ${buildCommand || "npm run build"}

FROM node:${nodeVersion} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${port}
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE ${port}
CMD ["sh", "-c", "npm start -- -p $PORT"]
`;

    case "react":
    case "vue":
    case "svelte":
    case "angular":
      return `FROM node:${nodeVersion} AS builder
WORKDIR /app
${buildEnvArgs ? buildEnvArgs + "\n" : ""}${buildEnvSet ? buildEnvSet + "\n" : ""}COPY package*.json ./
RUN ${installCommand || "npm install"}
COPY . .
RUN ${buildCommand || "npm run build"}

FROM nginx:alpine
COPY --from=builder /app/${outputDir || "dist"} /usr/share/nginx/html
RUN echo 'server { listen ${port}; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE ${port}
CMD ["nginx", "-g", "daemon off;"]
`;

    case "nuxt":
      return `FROM node:${nodeVersion} AS builder
WORKDIR /app
COPY package*.json ./
RUN ${installCommand || "npm install"}
COPY . .
RUN ${buildCommand || "npm run build"}

FROM node:${nodeVersion} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${port}
ENV NITRO_PORT=${port}
COPY --from=builder /app/.output ./.output
EXPOSE ${port}
CMD ["node", ".output/server/index.mjs"]
`;

    case "express":
    case "nestjs":
      return `FROM node:${nodeVersion}
WORKDIR /app
COPY package*.json ./
RUN ${installCommand || "npm install"}
COPY . .
${buildCommand ? `RUN ${buildCommand}` : ""}
ENV PORT=${port}
EXPOSE ${port}
CMD ${startCommand ? `["sh", "-c", "${startCommand}"]` : '["npm", "start"]'}
`;

    case "static":
      return `FROM nginx:alpine
COPY . /usr/share/nginx/html
RUN echo 'server { listen ${port}; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE ${port}
CMD ["nginx", "-g", "daemon off;"]
`;

    default:
      return `FROM node:${nodeVersion}
WORKDIR /app
COPY . .
RUN ${installCommand || "npm install"}
${buildCommand ? `RUN ${buildCommand}` : ""}
ENV PORT=${port}
EXPOSE ${port}
CMD ${startCommand ? `["sh", "-c", "${startCommand}"]` : '["npm", "start"]'}
`;
  }
}

export async function buildImage(
  deployment: Deployment,
  repoPath: string,
  onLog: (log: string) => void
): Promise<string> {
  const imageName = `echorcel-${deployment.name}:latest`.toLowerCase().replace(/[^a-z0-9-:]/g, "-");
  const workDir = deployment.rootDirectory
    ? path.join(repoPath, deployment.rootDirectory)
    : repoPath;

  const dockerfilePath = path.join(workDir, "Dockerfile");
  const hasDockerfile = fs.existsSync(dockerfilePath);

  if (!hasDockerfile && deployment.framework !== "docker-compose") {
    const dockerfile = generateDockerfile(
      deployment.framework,
      deployment.buildCommand,
      deployment.installCommand,
      deployment.startCommand,
      deployment.outputDirectory,
      deployment.port,
      deployment.envVariables || []
    );
    fs.writeFileSync(dockerfilePath, dockerfile);
    onLog(`[Echorcel] Auto-generated Dockerfile for ${deployment.framework}`);
  }

  onLog(`[Echorcel] Building Docker image: ${imageName}`);

  // Build args for env variables (needed at build time for static sites)
  const buildargs: Record<string, string> = {};
  for (const env of deployment.envVariables || []) {
    buildargs[env.key] = env.value;
  }

  const stream = await docker.buildImage(
    {
      context: workDir,
      src: ["."],
    },
    { t: imageName, buildargs }
  );

  return new Promise((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err, output) => {
        if (err) {
          onLog(`[Error] Build failed: ${err.message}`);
          reject(err);
        } else {
          const lastOutput = output[output.length - 1];
          if (lastOutput?.aux?.ID) {
            onLog(`[Echorcel] Image built successfully: ${lastOutput.aux.ID}`);
            resolve(imageName);
          } else {
            resolve(imageName);
          }
        }
      },
      (event) => {
        if (event.stream) {
          onLog(event.stream.trim());
        }
        if (event.error) {
          onLog(`[Error] ${event.error}`);
        }
      }
    );
  });
}

export async function createAndStartContainer(
  deployment: Deployment,
  imageName: string,
  onLog: (log: string) => void
): Promise<string> {
  const containerName = `echorcel-${deployment.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Remove existing container if exists
  try {
    const existingContainer = docker.getContainer(containerName);
    await existingContainer.stop().catch(() => {});
    await existingContainer.remove();
    onLog(`[Echorcel] Removed existing container: ${containerName}`);
  } catch (_error) {
    // Container doesn't exist, continue
  }

  const envArray = deployment.envVariables.map((e) => `${e.key}=${e.value}`);
  
  // Add PORT env variable so the app listens on the specified port
  envArray.push(`PORT=${deployment.port}`);

  // Map restart policy
  const restartPolicy = deployment.restartPolicy || "always";
  const restartPolicyConfig: { Name: string; MaximumRetryCount?: number } = { Name: restartPolicy };
  if (restartPolicy === "on-failure") {
    restartPolicyConfig.MaximumRetryCount = 5;
  }

  onLog(`[Echorcel] Creating container: ${containerName} (restart: ${restartPolicy})`);

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    Env: envArray,
    ExposedPorts: {
      [`${deployment.port}/tcp`]: {},
    },
    HostConfig: {
      PortBindings: {
        [`${deployment.port}/tcp`]: [{ HostPort: String(deployment.port) }],
      },
      RestartPolicy: restartPolicyConfig,
    },
  });

  await container.start();
  onLog(`[Echorcel] Container started on port ${deployment.port}`);

  return container.id;
}

export async function stopContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 5 }); // 5 second timeout
  } catch (error) {
    // Container may already be stopped
    console.log(`Stop container ${containerId}:`, error instanceof Error ? error.message : error);
  }
}

export async function startContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.start();
}

export async function removeContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    // Force stop and remove
    await container.stop({ t: 2 }).catch(() => {});
    await container.remove({ force: true });
  } catch (error) {
    // Container may not exist
    console.log(`Remove container ${containerId}:`, error instanceof Error ? error.message : error);
  }
}

export async function removeImage(imageName: string): Promise<void> {
  try {
    const image = docker.getImage(imageName);
    await image.remove({ force: true });
  } catch (_error) {
    // Image may not exist
  }
}

export async function getContainerLogs(
  containerId: string,
  tail: number = 100
): Promise<string[]> {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    return logs.toString().split("\n").filter(Boolean);
  } catch (_error) {
    return [];
  }
}

export async function streamContainerLogs(
  containerId: string,
  onLog: (log: string) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const container = docker.getContainer(containerId);

  const logStream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    timestamps: true,
  });

  logStream.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      // Remove Docker log header (8 bytes)
      const cleanLine = line.length > 8 ? line.slice(8) : line;
      onLog(cleanLine);
    }
  });

  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      (logStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
    });
  }
}

export async function getContainerStatus(
  containerId: string
): Promise<"running" | "stopped" | "not_found"> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Running ? "running" : "stopped";
  } catch (_error) {
    return "not_found";
  }
}

export async function listEchorcelContainers(): Promise<Docker.ContainerInfo[]> {
  const containers = await docker.listContainers({ all: true });
  return containers.filter((c) => c.Names.some((n) => n.includes("echorcel-")));
}
