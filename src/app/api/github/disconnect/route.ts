import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();
    await usersCollection.updateOne(
      { _id: session.userId },
      {
        $unset: { github: "" },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect GitHub:", error);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub" },
      { status: 500 }
    );
  }
}
