import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { decryptToken, getGitHubRepos, searchGitHubRepos } from "@/lib/github";
import type { User } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();
    const user = (await usersCollection.findOne({
      _id: session.userId,
    })) as User | null;

    if (!user?.github?.accessToken) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const accessToken = decryptToken(user.github.accessToken);

    let repos;
    if (query) {
      repos = await searchGitHubRepos(accessToken, query);
    } else {
      repos = await getGitHubRepos(accessToken, page);
    }

    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        language: repo.language,
        description: repo.description,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
