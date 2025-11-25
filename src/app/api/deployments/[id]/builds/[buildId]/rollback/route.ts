import { NextRequest, NextResponse } from "next/server";
import {
  getDeploymentsCollection,
  getBuildsCollection,
} from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Build } from "@/types/build";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; buildId: string }> }
) {
  try {
    const { id, buildId } = await params;
    const buildsCollection = await getBuildsCollection();
    const deploymentsCollection = await getDeploymentsCollection();

    const targetBuild = await buildsCollection.findOne({
      _id: new ObjectId(buildId),
      deploymentId: new ObjectId(id),
    });

    if (!targetBuild) {
      return NextResponse.json(
        { error: "Build not found" },
        { status: 404 }
      );
    }

    if (targetBuild.status !== "ready") {
      return NextResponse.json(
        { error: "Can only rollback to successful builds" },
        { status: 400 }
      );
    }

    const deployment = await deploymentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    // Get the next build number
    const lastBuild = await buildsCollection
      .find({ deploymentId: new ObjectId(id) })
      .sort({ buildNumber: -1 })
      .limit(1)
      .toArray();

    const nextBuildNumber = lastBuild.length > 0 ? lastBuild[0].buildNumber + 1 : 1;

    // Mark all builds as not current
    await buildsCollection.updateMany(
      { deploymentId: new ObjectId(id) },
      { $set: { isCurrent: false } }
    );

    // Create a new rollback build record
    const now = new Date();
    const rollbackBuild: Omit<Build, "_id"> = {
      deploymentId: new ObjectId(id),
      buildNumber: nextBuildNumber,
      status: "queued",
      branch: targetBuild.branch,
      commit: {
        sha: targetBuild.commit.sha,
        message: `Rollback to build #${targetBuild.buildNumber}`,
        author: "System",
      },
      trigger: "rollback",
      isCurrent: true,
      logs: [],
      createdAt: now,
    };

    const result = await buildsCollection.insertOne(rollbackBuild);

    // Update deployment status
    await deploymentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "pending",
          logs: [],
          updatedAt: now,
        },
      }
    );

    // Trigger deploy in background
    const baseUrl = _request.headers.get("host") || "localhost:3001";
    const protocol = baseUrl.includes("localhost") ? "http" : "https";

    fetch(`${protocol}://${baseUrl}/api/deployments/${id}/deploy`, {
      method: "POST",
    }).catch((err) => {
      console.error("Failed to trigger rollback deploy:", err);
    });

    return NextResponse.json({
      build: {
        ...rollbackBuild,
        _id: result.insertedId.toString(),
        deploymentId: id,
      },
      message: "Rollback initiated",
    });
  } catch (error) {
    console.error("Failed to rollback:", error);
    return NextResponse.json(
      { error: "Failed to rollback" },
      { status: 500 }
    );
  }
}
