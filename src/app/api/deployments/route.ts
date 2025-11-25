import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { Deployment, DeploymentStats, DeploymentStatus } from "@/types/deployment";
import { ObjectId } from "mongodb";
import { getContainerStatus } from "@/lib/docker";
import { validateDeploymentPort, PORT_CONFIG } from "@/lib/ports";

export async function GET() {
  try {
    const collection = await getDeploymentsCollection();
    const deployments = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Sync status with actual Docker container status
    const syncedDeployments = await Promise.all(
      deployments.map(async (deployment) => {
        // Only check containers that we think are running or stopped
        if (deployment.containerId && ["running", "stopped"].includes(deployment.status)) {
          const actualStatus = await getContainerStatus(deployment.containerId);
          
          let newStatus: DeploymentStatus = deployment.status as DeploymentStatus;
          if (actualStatus === "running" && deployment.status !== "running") {
            newStatus = "running";
          } else if (actualStatus === "stopped" && deployment.status === "running") {
            newStatus = "stopped";
          } else if (actualStatus === "not_found" && deployment.status === "running") {
            newStatus = "stopped";
          }

          // Update in database if status changed
          if (newStatus !== deployment.status) {
            await collection.updateOne(
              { _id: deployment._id },
              { $set: { status: newStatus, updatedAt: new Date() } }
            );
            return { ...deployment, status: newStatus };
          }
        }
        return deployment;
      })
    );

    const stats: DeploymentStats = {
      total: syncedDeployments.length,
      active: syncedDeployments.filter((d) => d.status === "running").length,
      building: syncedDeployments.filter((d) =>
        ["pending", "cloning", "building"].includes(d.status as string)
      ).length,
      failed: syncedDeployments.filter((d) => d.status === "failed").length,
    };

    return NextResponse.json({ deployments: syncedDeployments, stats });
  } catch (error) {
    console.error("Failed to fetch deployments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate port is not reserved
    const port = body.port || PORT_CONFIG.MIN_PORT;
    const portError = validateDeploymentPort(port);
    if (portError) {
      return NextResponse.json({ error: portError }, { status: 400 });
    }

    const deployment: Omit<Deployment, "_id"> = {
      name: body.name,
      gitUrl: body.gitUrl,
      branch: body.branch || "main",
      rootDirectory: body.rootDirectory || "",
      framework: body.framework,
      buildCommand: body.buildCommand || "",
      outputDirectory: body.outputDirectory || "",
      installCommand: body.installCommand || "npm install",
      startCommand: body.startCommand || "npm start",
      envVariables: body.envVariables || [],
      port,
      restartPolicy: body.restartPolicy || "always",
      status: "pending" as DeploymentStatus,
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await getDeploymentsCollection();
    const result = await collection.insertOne(deployment);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...deployment,
    });
  } catch (error) {
    console.error("Failed to create deployment:", error);
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing deployment ID" }, { status: 400 });
    }

    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({ _id: new ObjectId(id) });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Import docker functions dynamically to avoid issues
    const { removeContainer, removeImage } = await import("@/lib/docker");

    if (deployment.containerId) {
      await removeContainer(deployment.containerId);
    }

    if (deployment.imageId) {
      await removeImage(deployment.imageId);
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete deployment:", error);
    return NextResponse.json(
      { error: "Failed to delete deployment" },
      { status: 500 }
    );
  }
}
