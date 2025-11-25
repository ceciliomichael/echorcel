import { NextRequest, NextResponse } from "next/server";
import { findAvailablePort, PORT_CONFIG } from "@/lib/ports";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startPort = searchParams.get("startPort");
    const maxPort = searchParams.get("maxPort");

    const result = await findAvailablePort(
      startPort ? parseInt(startPort, 10) : undefined,
      maxPort ? parseInt(maxPort, 10) : undefined
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ port: result.port });
  } catch (error) {
    console.error("Failed to find available port:", error);
    return NextResponse.json(
      { error: "Failed to find available port" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const startPort = body.startPort ?? PORT_CONFIG.MIN_PORT;
    const maxPort = body.maxPort ?? PORT_CONFIG.MAX_PORT;

    const result = await findAvailablePort(startPort, maxPort);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ port: result.port });
  } catch (error) {
    console.error("Failed to find available port:", error);
    return NextResponse.json(
      { error: "Failed to find available port" },
      { status: 500 }
    );
  }
}
