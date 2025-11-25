import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  try {
    // Echorcel is single-admin; use the admin user as the GitHub owner
    const user = await getAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
