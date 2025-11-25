import { NextRequest, NextResponse } from "next/server";
import { triggerDeploy } from "@/lib/deploy-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get trigger type from body (if provided)
    let trigger: "manual" | "webhook" = "manual";
    try {
      const body = await request.json();
      if (body.trigger === "webhook") {
        trigger = "webhook";
      }
    } catch (_error) {
      // No body or invalid JSON - default to manual
    }

    const result = await triggerDeploy(id, trigger);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({ message: result.message, id });
  } catch (error) {
    console.error("Failed to start deployment:", error);
    return NextResponse.json(
      { error: "Failed to start deployment" },
      { status: 500 }
    );
  }
}
