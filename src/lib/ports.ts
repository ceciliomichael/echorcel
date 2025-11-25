import * as net from "net";
import { getDeploymentsCollection } from "./mongodb";

// Port configuration for Echorcel deployments
export const PORT_CONFIG = {
  // Echorcel app runs on this port - NEVER use for deployments
  ECHORCEL_PORT: 3099,
  // Deployment port range
  MIN_PORT: 3100,
  MAX_PORT: 3200,
} as const;

/**
 * Check if a port is available on the system
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, "0.0.0.0");
  });
}

/**
 * Get ports already used by running/pending/building deployments in the database
 */
async function getUsedDeploymentPorts(): Promise<number[]> {
  try {
    const collection = await getDeploymentsCollection();
    const deployments = await collection
      .find({
        status: { $in: ["running", "pending", "building", "cloning"] },
      })
      .project({ port: 1 })
      .toArray();

    return deployments.map((d) => d.port).filter((p): p is number => typeof p === "number");
  } catch (_error) {
    // If DB fails, return empty array and rely on system port check
    return [];
  }
}

/**
 * Find the next available port in the configured range
 * Skips:
 * - Echorcel's own port (3099)
 * - Ports already used by deployments in DB
 * - Ports that are in use on the system
 */
export async function findAvailablePort(
  startPort?: number,
  maxPort?: number
): Promise<{ port: number } | { error: string }> {
  const minPort = startPort ?? PORT_CONFIG.MIN_PORT;
  const maxP = maxPort ?? PORT_CONFIG.MAX_PORT;

  // Get ports already reserved by deployments
  const usedPorts = await getUsedDeploymentPorts();
  const reservedPorts = new Set([PORT_CONFIG.ECHORCEL_PORT, ...usedPorts]);

  for (let port = minPort; port <= maxP; port++) {
    // Skip reserved ports
    if (reservedPorts.has(port)) {
      continue;
    }

    // Check if port is available on the system
    const available = await isPortAvailable(port);
    if (available) {
      return { port };
    }
  }

  return { error: `No available port found in range ${minPort}-${maxP}` };
}

/**
 * Validate that a port is allowed for deployment
 * Returns error message if invalid, null if valid
 */
export function validateDeploymentPort(port: number): string | null {
  if (port === PORT_CONFIG.ECHORCEL_PORT) {
    return `Port ${PORT_CONFIG.ECHORCEL_PORT} is reserved for Echorcel. Please choose a different port.`;
  }

  if (port < 1 || port > 65535) {
    return "Port must be between 1 and 65535.";
  }

  return null;
}
