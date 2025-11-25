import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { startContainer } from "@/lib/docker";

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

    if (!deployment.containerId) {
      return NextResponse.json(
        { error: "No container found. Please deploy first." },
        { status: 400 }
      );
    }

    // Start existing container
    await startContainer(deployment.containerId);

    const logEntry = `[${new Date().toISOString()}] Container started`;
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "running",
          updatedAt: new Date(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { logs: logEntry } as any,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to start container:", error);
    return NextResponse.json(
      { error: "Failed to start container" },
      { status: 500 }
    );
  }
}
