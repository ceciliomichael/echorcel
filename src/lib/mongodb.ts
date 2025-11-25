import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/echorcel";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDeploymentsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("deployments");
}

export async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection("users");
}

export async function getSessionsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("sessions");
}

export async function getWebhooksCollection() {
  const { db } = await connectToDatabase();
  return db.collection("webhooks");
}

export async function getWebhookLogsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("webhook_logs");
}

export async function getBuildsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("builds");
}

export async function getAppSettingsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("app_settings");
}
