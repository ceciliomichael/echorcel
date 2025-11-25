import { NextRequest } from "next/server";
import { getDeploymentsCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getContainerLogs, streamContainerLogs } from "@/lib/docker";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get("stream") === "true";

  try {
    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({ _id: new ObjectId(id) });

    if (!deployment) {
      return new Response(JSON.stringify({ error: "Deployment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return stored logs first
    const storedLogs = deployment.logs || [];

    if (!stream) {
      // Get container logs if running
      let containerLogs: string[] = [];
      if (deployment.containerId) {
        containerLogs = await getContainerLogs(deployment.containerId, 50);
      }

      return new Response(
        JSON.stringify({
          buildLogs: storedLogs,
          containerLogs,
          status: deployment.status,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream logs using Server-Sent Events
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        // Send stored build logs first
        for (const log of storedLogs) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "build", log })}\n\n`));
        }

        // If container is running, stream container logs
        if (deployment.containerId && deployment.status === "running") {
          const abortController = new AbortController();

          try {
            await streamContainerLogs(
              deployment.containerId,
              (log) => {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "container", log })}\n\n`)
                );
              },
              abortController.signal
            );
          } catch (_error) {
            // Stream ended or error
          }
        }

        // Poll for new build logs if still building
        if (["pending", "cloning", "building"].includes(deployment.status as string)) {
          let lastLogCount = storedLogs.length;
          const pollInterval = setInterval(async () => {
            try {
              const updated = await collection.findOne({ _id: new ObjectId(id) });
              if (!updated) {
                clearInterval(pollInterval);
                controller.close();
                return;
              }

              const newLogs = (updated.logs || []).slice(lastLogCount);
              for (const log of newLogs) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "build", log })}\n\n`)
                );
              }
              lastLogCount = (updated.logs || []).length;

              // Send status update
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "status", status: updated.status })}\n\n`
                )
              );

              // Stop polling if deployment finished
              if (!["pending", "cloning", "building"].includes(updated.status as string)) {
                clearInterval(pollInterval);

                // Stream container logs if now running
                if (updated.status === "running" && updated.containerId) {
                  await streamContainerLogs(updated.containerId, (log) => {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "container", log })}\n\n`)
                    );
                  });
                }
              }
            } catch (_error) {
              clearInterval(pollInterval);
            }
          }, 1000);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
