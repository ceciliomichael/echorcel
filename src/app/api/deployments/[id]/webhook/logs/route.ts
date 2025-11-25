import { NextRequest, NextResponse } from "next/server";
import { getWebhooksCollection, getWebhookLogsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const webhooksCollection = await getWebhooksCollection();

    const webhook = await webhooksCollection.findOne({
      deploymentId: new ObjectId(id),
    });

    if (!webhook) {
      return NextResponse.json({ logs: [] });
    }

    const logsCollection = await getWebhookLogsCollection();
    const logs = await logsCollection
      .find({ webhookId: webhook._id })
      .sort({ triggeredAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      logs: logs.map((log) => ({
        ...log,
        _id: log._id.toString(),
        webhookId: log.webhookId.toString(),
        deploymentId: log.deploymentId.toString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch webhook logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }
}
