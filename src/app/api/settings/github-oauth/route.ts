import { NextRequest, NextResponse } from "next/server";
import {
  getGitHubOAuthConfig,
  setGitHubOAuthConfig,
  clearGitHubOAuthConfig,
} from "@/lib/app-settings";

export async function GET() {
  try {
    const config = await getGitHubOAuthConfig();

    return NextResponse.json({
      configured: config.configured,
      // Only return masked client ID for display
      clientId: config.clientId
        ? `${config.clientId.slice(0, 8)}...${config.clientId.slice(-4)}`
        : null,
    });
  } catch (error) {
    console.error("Failed to get GitHub OAuth config:", error);
    return NextResponse.json(
      { error: "Failed to get configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID and Client Secret are required" },
        { status: 400 }
      );
    }

    // Basic validation
    if (clientId.length < 10 || clientSecret.length < 10) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    await setGitHubOAuthConfig(clientId, clientSecret);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save GitHub OAuth config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearGitHubOAuthConfig();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear GitHub OAuth config:", error);
    return NextResponse.json(
      { error: "Failed to clear configuration" },
      { status: 500 }
    );
  }
}
