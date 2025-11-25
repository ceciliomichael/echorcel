"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Loader2 } from "lucide-react";

interface GitHubStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
}

export function GitHubConnection() {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      setStatus(data);
    } catch (_error) {
      console.error("Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch("/api/github/disconnect", { method: "POST" });
      setStatus({ connected: false });
    } catch (_error) {
      console.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
        <div className="flex items-center gap-4 min-w-0">
          {status.avatarUrl ? (
            <img src={status.avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-900">{status.username}</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              Connected {new Date(status.connectedAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex sm:justify-end">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <a
      href="/api/github/connect"
      className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors group"
    >
      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
        <Github className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900">Connect GitHub Account</span>
        </div>
        <p className="text-sm text-zinc-500">Link your account to browse repositories</p>
      </div>
      <span className="text-sm font-medium text-accent-600 group-hover:text-accent-700">
        Connect →
      </span>
    </a>
  );
}
