"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Loader2, RefreshCw } from "lucide-react";
import type { DeploymentStatus } from "@/types/deployment";

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: string;
  deploymentName: string;
  status: DeploymentStatus;
}

interface LogEntry {
  type: "build" | "container" | "status";
  log?: string;
  status?: DeploymentStatus;
}

export function LogViewer({
  isOpen,
  onClose,
  deploymentId,
  deploymentName,
  status: initialStatus,
}: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<DeploymentStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isOpen || !deploymentId) return;

    setLogs([]);
    setIsLoading(true);
    setStatus(initialStatus);

    // Start SSE connection for real-time logs
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
  }, [isOpen, deploymentId, initialStatus]);

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

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Logs: ${deploymentName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Status:</span>
            {getStatusBadge()}
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <ScrollArea>
          <div
            ref={scrollRef}
            className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 h-[400px] overflow-y-auto font-mono text-sm"
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
        </ScrollArea>
      </div>
    </Modal>
  );
}
