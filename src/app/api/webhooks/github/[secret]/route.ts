import { NextRequest, NextResponse } from "next/server";
import {
  getDeploymentsCollection,
  getWebhooksCollection,
  getWebhookLogsCollection,
} from "@/lib/mongodb";
import { createHmac, timingSafeEqual } from "crypto";
import type { WebhookPayload, WebhookLog } from "@/types/webhook";
import { triggerDeploy } from "@/lib/deploy-service";

function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (_error) {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  try {
    const webhooksCollection = await getWebhooksCollection();

    const webhook = await webhooksCollection.findOne({ secret });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    if (!webhook.enabled) {
      return NextResponse.json(
        { error: "Webhook is disabled" },
        { status: 403 }
      );
    }

    const rawBody = await request.text();
    const githubSignature = request.headers.get("x-hub-signature-256");
    const githubEvent = request.headers.get("x-github-event");

    if (
      githubSignature &&
      !verifyGitHubSignature(rawBody, githubSignature, secret)
    ) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const webhookLogsCollection = await getWebhookLogsCollection();

    if (githubEvent === "ping") {
      const log: Omit<WebhookLog, "_id"> = {
        webhookId: webhook._id,
        deploymentId: webhook.deploymentId,
        event: "ping",
        payload,
        status: "success",
        message: "Webhook configured successfully",
        triggeredAt: new Date(),
      };
      await webhookLogsCollection.insertOne(log);

      return NextResponse.json({
        message: "Webhook configured successfully",
      });
    }

    if (githubEvent !== "push") {
      const log: Omit<WebhookLog, "_id"> = {
        webhookId: webhook._id,
        deploymentId: webhook.deploymentId,
        event: githubEvent || "unknown",
        payload,
        status: "skipped",
        message: `Event type "${githubEvent}" not configured for auto-deploy`,
        triggeredAt: new Date(),
      };
      await webhookLogsCollection.insertOne(log);

      return NextResponse.json({
        message: `Event "${githubEvent}" skipped`,
      });
    }

    const deploymentsCollection = await getDeploymentsCollection();
    const deployment = await deploymentsCollection.findOne({
      _id: webhook.deploymentId,
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    const pushRef = payload.ref || "";
    const branch = pushRef.replace("refs/heads/", "");

    if (branch !== deployment.branch) {
      const log: Omit<WebhookLog, "_id"> = {
        webhookId: webhook._id,
        deploymentId: webhook.deploymentId,
        event: "push",
        payload,
        status: "skipped",
        message: `Push to branch "${branch}" skipped (configured branch: "${deployment.branch}")`,
        triggeredAt: new Date(),
      };
      await webhookLogsCollection.insertOne(log);

      return NextResponse.json({
        message: `Push to branch "${branch}" skipped`,
      });
    }

    await webhooksCollection.updateOne(
      { _id: webhook._id },
      {
        $set: { lastTriggeredAt: new Date() },
        $inc: { triggerCount: 1 },
      }
    );

    const commitMessage = payload.head_commit?.message || "Auto-deploy triggered";
    const commitAuthor = payload.head_commit?.author?.name || "Unknown";

    await deploymentsCollection.updateOne(
      { _id: deployment._id },
      {
        $set: {
          status: "pending",
          logs: [],
          updatedAt: new Date(),
        },
      }
    );

    const log: Omit<WebhookLog, "_id"> = {
      webhookId: webhook._id,
      deploymentId: webhook.deploymentId,
      event: "push",
      payload,
      status: "success",
      message: `Deploy triggered by ${commitAuthor}: "${commitMessage}"`,
      triggeredAt: new Date(),
    };
    await webhookLogsCollection.insertOne(log);

    // Trigger deploy directly (no HTTP round-trip needed)
    triggerDeploy(deployment._id.toString(), "webhook").catch((err) => {
      console.error("Failed to trigger deploy:", err);
    });

    return NextResponse.json({
      message: "Deploy triggered",
      commit: {
        message: commitMessage,
        author: commitAuthor,
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
