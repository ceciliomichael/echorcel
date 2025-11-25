import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getGitHubOAuthUrl } from "@/lib/github";
import { getGitHubOAuthConfig } from "@/lib/app-settings";

export async function GET(request: NextRequest) {
  // Determine external base URL (supports tunnels/proxies via APP_URL)
  const hostHeader = request.headers.get("host") || "localhost:3099";
  const inferredProtocol =
    hostHeader.includes("localhost") || hostHeader.startsWith("127.") ? "http" : "https";
  const inferredBaseUrl = `${inferredProtocol}://${hostHeader}`;
  const baseUrl = process.env.APP_URL || inferredBaseUrl;
  const isHttps = baseUrl.startsWith("https://");

  try {
    // Get OAuth config from database
    const config = await getGitHubOAuthConfig();

    if (!config.configured || !config.clientId) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=not_configured", baseUrl)
      );
    }

    // Generate state for CSRF protection
    const state = randomBytes(16).toString("hex");

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set("github_oauth_state", state, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    const authUrl = getGitHubOAuthUrl(config.clientId, state, baseUrl);

    // Redirect directly to GitHub
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Failed to start GitHub OAuth:", error);
    // Redirect back to settings with error
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=oauth_failed", baseUrl));
  }
}
