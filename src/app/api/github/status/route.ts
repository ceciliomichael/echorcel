import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import type { User } from "@/types/auth";

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();
    const user = (await usersCollection.findOne({
      _id: session.userId,
    })) as User | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.github) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      username: user.github.username,
      avatarUrl: user.github.avatarUrl,
      connectedAt: user.github.connectedAt,
    });
  } catch (error) {
    console.error("Failed to get GitHub status:", error);
    return NextResponse.json(
      { error: "Failed to get GitHub status" },
      { status: 500 }
    );
  }
}
