import { NextResponse } from "next/server";
import { getAuthStatus } from "@/lib/auth";

export async function GET() {
  try {
    const status = await getAuthStatus();
    return NextResponse.json(status);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to get auth status" },
      { status: 500 }
    );
  }
}
