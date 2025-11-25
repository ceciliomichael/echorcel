import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { getGitHubOAuthConfig } from "./app-settings";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "echorcel-default-secret-key-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function getGitHubOAuthUrl(clientId: string, state: string, baseUrl: string): string {
  const redirectUri = `${baseUrl}/api/github/callback`;
  const scope = "repo read:user";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const config = await getGitHubOAuthConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error("GitHub OAuth credentials not configured");
  }

  const clientId = config.clientId;
  const clientSecret = config.clientSecret;

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

export async function getGitHubUser(accessToken: string): Promise<{
  login: string;
  avatar_url: string;
  name: string | null;
}> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user");
  }

  return response.json();
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
  language: string | null;
  description: string | null;
}

export async function getGitHubRepos(
  accessToken: string,
  page = 1,
  perPage = 30
): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub repos");
  }

  return response.json();
}

export async function searchGitHubRepos(
  accessToken: string,
  query: string
): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+user:@me&sort=updated&per_page=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!response.ok) {
    // Fallback to filtering user repos
    const repos = await getGitHubRepos(accessToken, 1, 100);
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(query.toLowerCase())
    );
  }

  const data = await response.json();
  return data.items || [];
}
