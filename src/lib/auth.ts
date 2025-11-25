import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getUsersCollection, getSessionsCollection } from "./mongodb";
import type { User, Session, AuthStatus } from "@/types/auth";

const SALT_ROUNDS = 12;
const SESSION_COOKIE_NAME = "echorcel_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function getAdmin(): Promise<User | null> {
  const collection = await getUsersCollection();
  const admin = await collection.findOne({ role: "admin" });
  return admin as User | null;
}

export async function hasAdmin(): Promise<boolean> {
  const admin = await getAdmin();
  return admin !== null;
}

export async function createAdmin(
  username: string,
  password: string
): Promise<User> {
  const collection = await getUsersCollection();

  const existingAdmin = await collection.findOne({ role: "admin" });
  if (existingAdmin) {
    throw new Error("Admin already exists");
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const user: Omit<User, "_id"> = {
    username,
    passwordHash,
    role: "admin",
    singleton: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user);
  return { ...user, _id: result.insertedId } as User;
}

export async function createSession(user: User): Promise<string> {
  const collection = await getSessionsCollection();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const now = new Date();

  const session: Omit<Session, "_id"> = {
    tokenHash,
    userId: user._id as ObjectId,
    username: user.username,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    createdAt: now,
  };

  await collection.insertOne(session);
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookie(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }
  return getSessionByToken(token);
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const collection = await getSessionsCollection();
  const session = await collection.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  return session as Session | null;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  const collection = await getSessionsCollection();
  await collection.deleteOne({ tokenHash });
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await deleteSession(tokenHash);
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const adminExists = await hasAdmin();
  const session = await getSessionFromCookie();

  return {
    hasAdmin: adminExists,
    isAuthenticated: session !== null,
    username: session?.username,
  };
}

export async function validateLogin(
  username: string,
  password: string
): Promise<User | null> {
  const collection = await getUsersCollection();
  const user = (await collection.findOne({
    username,
    role: "admin",
  })) as User | null;

  if (!user) {
    return null;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    await collection.updateOne(
      { _id: user._id },
      {
        $inc: { failedLoginAttempts: 1 },
        $set: { updatedAt: new Date() },
      }
    );
    return null;
  }

  await collection.updateOne(
    { _id: user._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return user;
}
