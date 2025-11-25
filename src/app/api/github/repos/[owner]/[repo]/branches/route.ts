import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { decryptToken } from "@/lib/github";
import type { User } from "@/types/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;

    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();
    const user = (await usersCollection.findOne({
      _id: session.userId,
    })) as User | null;

    if (!user?.github?.accessToken) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    const accessToken = decryptToken(user.github.accessToken);

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
    }

    const branches = await response.json();

    return NextResponse.json({
      branches: branches.map((b: { name: string; protected: boolean }) => ({
        name: b.name,
        protected: b.protected,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}
