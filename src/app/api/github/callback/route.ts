import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUsersCollection } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import {
  exchangeCodeForToken,
  getGitHubUser,
  encryptToken,
} from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?error=missing_params", request.url)
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get("github_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/settings?error=invalid_state", request.url)
      );
    }

    // Clear state cookie
    cookieStore.delete("github_oauth_state");

    // Verify user is authenticated
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Get GitHub user info
    const githubUser = await getGitHubUser(accessToken);

    // Encrypt and store token
    const encryptedToken = encryptToken(accessToken);

    const usersCollection = await getUsersCollection();
    await usersCollection.updateOne(
      { _id: session.userId },
      {
        $set: {
          github: {
            accessToken: encryptedToken,
            username: githubUser.login,
            avatarUrl: githubUser.avatar_url,
            connectedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.redirect(
      new URL("/settings?github=connected", request.url)
    );
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }
}
