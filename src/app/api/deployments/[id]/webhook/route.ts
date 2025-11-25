import { NextRequest, NextResponse } from "next/server";
import { getDeploymentsCollection, getWebhooksCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import type { Webhook } from "@/types/webhook";

function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

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
      return NextResponse.json({ webhook: null });
    }

    return NextResponse.json({
      webhook: {
        ...webhook,
        _id: webhook._id.toString(),
        deploymentId: webhook.deploymentId.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch webhook:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deploymentsCollection = await getDeploymentsCollection();
    const deployment = await deploymentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    const webhooksCollection = await getWebhooksCollection();

    const existingWebhook = await webhooksCollection.findOne({
      deploymentId: new ObjectId(id),
    });

    if (existingWebhook) {
      const newSecret = generateWebhookSecret();
      await webhooksCollection.updateOne(
        { _id: existingWebhook._id },
        {
          $set: {
            secret: newSecret,
            updatedAt: new Date(),
          },
        }
      );

      const updated = await webhooksCollection.findOne({
        _id: existingWebhook._id,
      });

      return NextResponse.json({
        webhook: {
          ...updated,
          _id: updated?._id.toString(),
          deploymentId: updated?.deploymentId.toString(),
        },
        message: "Webhook secret regenerated",
      });
    }

    const now = new Date();
    const webhook: Omit<Webhook, "_id"> = {
      deploymentId: new ObjectId(id),
      secret: generateWebhookSecret(),
      enabled: true,
      events: ["push"],
      triggerCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await webhooksCollection.insertOne(webhook);

    return NextResponse.json({
      webhook: {
        ...webhook,
        _id: result.insertedId.toString(),
        deploymentId: id,
      },
      message: "Webhook created",
    });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
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
    const webhooksCollection = await getWebhooksCollection();

    const webhook = await webhooksCollection.findOne({
      deploymentId: new ObjectId(id),
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const updateData: Partial<Webhook> = {
      updatedAt: new Date(),
    };

    if (typeof body.enabled === "boolean") {
      updateData.enabled = body.enabled;
    }

    if (Array.isArray(body.events)) {
      updateData.events = body.events;
    }

    await webhooksCollection.updateOne(
      { _id: webhook._id },
      { $set: updateData }
    );

    const updated = await webhooksCollection.findOne({ _id: webhook._id });

    return NextResponse.json({
      webhook: {
        ...updated,
        _id: updated?._id.toString(),
        deploymentId: updated?.deploymentId.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to update webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const webhooksCollection = await getWebhooksCollection();

    await webhooksCollection.deleteOne({
      deploymentId: new ObjectId(id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
