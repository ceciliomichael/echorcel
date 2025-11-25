import type { ObjectId } from "mongodb";

export interface Webhook {
  _id?: ObjectId;
  deploymentId: ObjectId;
  secret: string;
  enabled: boolean;
  events: WebhookEvent[];
  lastTriggeredAt?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent = "push" | "pull_request";

export interface WebhookPayload {
  ref?: string;
  repository?: {
    full_name: string;
    clone_url: string;
    default_branch: string;
  };
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
    };
  };
  sender?: {
    login: string;
    avatar_url: string;
  };
}

export interface WebhookLog {
  _id?: ObjectId;
  webhookId: ObjectId;
  deploymentId: ObjectId;
  event: string;
  payload: WebhookPayload;
  status: "success" | "failed" | "skipped";
  message: string;
  triggeredAt: Date;
}
