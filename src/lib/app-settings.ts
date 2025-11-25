import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { getAppSettingsCollection } from "./mongodb";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// Use a derived key from AUTH_SECRET or a default for encryption
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "echorcel-default-secret-key-change-me";
  return createHash("sha256").update(secret).digest();
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function getSetting(key: string): Promise<string | null> {
  const collection = await getAppSettingsCollection();
  const setting = await collection.findOne({ key });

  if (!setting) return null;

  if (setting.encrypted) {
    try {
      return decrypt(setting.value);
    } catch {
      return null;
    }
  }

  return setting.value;
}

export async function setSetting(
  key: string,
  value: string,
  encrypted = false
): Promise<void> {
  const collection = await getAppSettingsCollection();
  const storedValue = encrypted ? encrypt(value) : value;

  await collection.updateOne(
    { key },
    {
      $set: {
        value: storedValue,
        encrypted,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const collection = await getAppSettingsCollection();
  await collection.deleteOne({ key });
}

// GitHub OAuth specific helpers
export async function getGitHubOAuthConfig(): Promise<{
  clientId: string | null;
  clientSecret: string | null;
  configured: boolean;
}> {
  const clientId = await getSetting("github_client_id");
  const clientSecret = await getSetting("github_client_secret");

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

export async function setGitHubOAuthConfig(
  clientId: string,
  clientSecret: string
): Promise<void> {
  await setSetting("github_client_id", clientId, true);
  await setSetting("github_client_secret", clientSecret, true);
}

export async function clearGitHubOAuthConfig(): Promise<void> {
  await deleteSetting("github_client_id");
  await deleteSetting("github_client_secret");
}
