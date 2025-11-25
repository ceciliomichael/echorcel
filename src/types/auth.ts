import type { ObjectId } from "mongodb";

export interface GitHubConnection {
  accessToken: string; // encrypted
  username: string;
  avatarUrl?: string;
  connectedAt: Date;
}

export interface User {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
  role: "admin";
  singleton: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  github?: GitHubConnection;
}

export interface Session {
  _id?: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  username: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthStatus {
  hasAdmin: boolean;
  isAuthenticated: boolean;
  username?: string;
}
