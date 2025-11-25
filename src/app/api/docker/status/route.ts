import { NextResponse } from "next/server";
import { testDockerConnection } from "@/lib/docker";

export async function GET() {
  try {
    const connected = await testDockerConnection();
    return NextResponse.json({ connected });
  } catch (_error) {
    return NextResponse.json({ connected: false });
  }
}
