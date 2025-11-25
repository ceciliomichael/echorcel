import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
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

    return NextResponse.json(deployment);
  } catch (error) {
    console.error("Failed to fetch deployment:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const collection = await getDeploymentsCollection();

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    delete updateData._id;

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update deployment:", error);
    return NextResponse.json(
      { error: "Failed to update deployment" },
      { status: 500 }
    );
  }
}
