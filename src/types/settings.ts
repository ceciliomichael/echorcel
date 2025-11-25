import type { ObjectId } from "mongodb";

export interface AppSettings {
  _id?: ObjectId;
  key: string;
  value: string; // encrypted for sensitive values
  encrypted: boolean;
  updatedAt: Date;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  configured: boolean;
}
