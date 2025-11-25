import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createAndStartContainer, stopContainer } from "@/lib/docker";
import { Deployment } from "@/types/deployment";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({ _id: new ObjectId(id) });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    if (!deployment.imageId) {
      return NextResponse.json(
        { error: "No image found. Please redeploy." },
        { status: 400 }
      );
    }

    // Stop existing container
    if (deployment.containerId) {
      await stopContainer(deployment.containerId);
    }

    // Start new container
    const containerId = await createAndStartContainer(
      deployment as unknown as Deployment,
      deployment.imageId,
      () => {}
    );

    const logEntry = `[${new Date().toISOString()}] Container restarted`;
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "running",
          containerId,
          updatedAt: new Date(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { logs: logEntry } as any,
      }
    );

    return NextResponse.json({ success: true, containerId });
  } catch (error) {
    console.error("Failed to restart deployment:", error);
    return NextResponse.json(
      { error: "Failed to restart deployment" },
      { status: 500 }
    );
  }
}
