import { NextRequest, NextResponse } from "next/server";
import { getBuildsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buildsCollection = await getBuildsCollection();

    const builds = await buildsCollection
      .find({ deploymentId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      builds: builds.map((build) => ({
        ...build,
        _id: build._id.toString(),
        deploymentId: build.deploymentId.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch builds:", error);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 }
    );
  }
}
