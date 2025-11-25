"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Re-subscribe when status changes to pending (redeploy started)
  useEffect(() => {
    if (initialStatus === "pending" && status !== "pending") {
      setLogs([]);
      setRefreshKey((k) => k + 1); // Force reconnect
    }
    setStatus(initialStatus);
  }, [initialStatus, status]);

  useEffect(() => {
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

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [deploymentId, refreshKey]);

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

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <Card>
      <CardHeader
        title="Build & Runtime Logs"
        description="Real-time logs from your deployment"
      />
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Status:</span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-all flex items-center gap-2 focus:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-md transition-all flex items-center gap-2 focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
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
