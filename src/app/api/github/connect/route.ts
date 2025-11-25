import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getGitHubOAuthUrl } from "@/lib/github";
import { getGitHubOAuthConfig } from "@/lib/app-settings";

export async function GET(request: NextRequest) {
  // Get the base URL from the request
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

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
      secure: protocol === "https",
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
