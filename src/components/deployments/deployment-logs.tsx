"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import type { DeploymentStatus } from "@/types/deployment";

interface DeploymentLogsProps {
  deploymentId: string;
  status: DeploymentStatus;
}

interface LogEntry {
  type: "build" | "container" | "status";
  log?: string;
  status?: DeploymentStatus;
}

export function DeploymentLogs({ deploymentId, status: initialStatus }: DeploymentLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<DeploymentStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setLogs([]);
    setIsLoading(true);
    setStatus(initialStatus);

    const eventSource = new EventSource(`/api/deployments/${deploymentId}/logs?stream=true`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data);
        if (data.type === "status" && data.status) {
          setStatus(data.status);
        } else if (data.log) {
          setLogs((prev) => [...prev, data.log as string]);
        }
        setIsLoading(false);
      } catch (_error) {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [deploymentId, initialStatus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRefresh = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setLogs([]);
    setIsLoading(true);

    const eventSource = new EventSource(`/api/deployments/${deploymentId}/logs?stream=true`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data);
        if (data.type === "status" && data.status) {
          setStatus(data.status);
        } else if (data.log) {
          setLogs((prev) => [...prev, data.log as string]);
        }
        setIsLoading(false);
      } catch (_error) {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsLoading(false);
      eventSource.close();
    };
  };

  const getStatusBadge = () => {
    const variants: Record<DeploymentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
      pending: "default",
      cloning: "info",
      building: "warning",
      running: "success",
      stopped: "default",
      failed: "danger",
    };

    return <Badge variant={variants[status]} dot>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader
        title="Build & Runtime Logs"
        description="Real-time logs from your deployment"
        action={
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-500">Status:</span>
          {getStatusBadge()}
        </div>

        <div
          ref={scrollRef}
          className="bg-zinc-900 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm dark-scrollbar"
        >
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400">
              No logs available
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="py-0.5 text-zinc-300 whitespace-pre-wrap break-all hover:bg-zinc-800 px-1 -mx-1 rounded"
              >
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
