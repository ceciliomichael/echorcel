import type { ObjectId } from "mongodb";

export type BuildStatus = "queued" | "building" | "ready" | "failed" | "cancelled";

export interface Build {
  _id?: ObjectId;
  deploymentId: ObjectId;
  buildNumber: number;
  status: BuildStatus;
  branch: string;
  commit: {
    sha: string;
    message: string;
    author: string;
    authorAvatar?: string;
  };
  trigger: "manual" | "webhook" | "rollback";
  isCurrent: boolean;
  duration?: number; // in seconds
  containerId?: string;
  imageId?: string;
  logs: string[];
  createdAt: Date;
  finishedAt?: Date;
}

export interface BuildSummary {
  _id: string;
  buildNumber: number;
  status: BuildStatus;
  branch: string;
  commit: {
    sha: string;
    message: string;
    author: string;
  };
  trigger: string;
  isCurrent: boolean;
  duration?: number;
  createdAt: Date;
  finishedAt?: Date;
}
