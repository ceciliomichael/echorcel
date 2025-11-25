"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  GitCommit,
  Loader2,
  RefreshCw,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Rocket,
  MoreVertical,
  FileText,
  Copy,
} from "lucide-react";
import type { BuildSummary, BuildStatus } from "@/types/build";

interface DeploymentHistoryProps {
  deploymentId: string;
  gitUrl: string;
}

export function DeploymentHistory({ deploymentId, gitUrl }: DeploymentHistoryProps) {
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Update "now" every second for real-time elapsed display
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBuilds = useCallback(async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/builds`);
      const data = await res.json();
      setBuilds(data.builds || []);
    } catch (_error) {
      console.error("Failed to fetch builds");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 5000);
    return () => clearInterval(interval);
  }, [fetchBuilds]);

  const handleRollback = async (buildId: string) => {
    setRollingBack(buildId);
    try {
      await fetch(`/api/deployments/${deploymentId}/builds/${buildId}/rollback`, {
        method: "POST",
      });
      fetchBuilds();
    } catch (_error) {
      console.error("Failed to rollback");
    } finally {
      setRollingBack(null);
    }
  };

  const getStatusBadge = (status: BuildStatus, isCurrent: boolean) => {
    if (isCurrent && status === "ready") {
      return (
        <Badge variant="success" dot>
          Current
        </Badge>
      );
    }

    const variants: Record<BuildStatus, "default" | "success" | "warning" | "danger" | "info"> = {
      queued: "default",
      building: "warning",
      ready: "success",
      failed: "danger",
      cancelled: "default",
    };

    return <Badge variant={variants[status]} dot>{status}</Badge>;
  };

  const getStatusIcon = (status: BuildStatus) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "building":
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case "queued":
        return <Clock className="w-4 h-4 text-zinc-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "-";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getElapsedTime = (createdAt: Date) => {
    const elapsed = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getRepoName = () => {
    try {
      const url = new URL(gitUrl.replace(".git", ""));
      return url.pathname.slice(1);
    } catch {
      return gitUrl;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Deployments</h2>
          <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
            <Rocket className="w-3.5 h-3.5" />
            Automatically created for pushes to{" "}
            <span className="font-mono text-zinc-700">{getRepoName()}</span>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchBuilds}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Builds List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : builds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3">
                <Rocket className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-medium text-zinc-900 mb-1">No deployments yet</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                Deploy your project or set up a webhook to auto-deploy on push.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {builds.map((build) => (
                <div
                  key={build._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-zinc-50 transition-colors"
                >
                  {/* Left: Build Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(build.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-zinc-900">
                          {build.commit.sha.slice(0, 7)}
                        </span>
                        {getStatusBadge(build.status, build.isCurrent)}
                        {build.trigger === "rollback" && (
                          <Badge variant="info">Rollback</Badge>
                        )}
                        {build.trigger === "webhook" && (
                          <Badge variant="default">Auto</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{build.branch}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
                        <p className="text-sm text-zinc-600 truncate">
                          {build.commit.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Meta & Actions */}
                  <div className="flex items-center gap-4 pl-7 sm:pl-0">
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Timer className={`w-3.5 h-3.5 ${build.status === "building" || build.status === "queued" ? "text-amber-500" : ""}`} />
                        <span className={build.status === "building" || build.status === "queued" ? "text-amber-600 font-medium tabular-nums" : ""}>
                          {build.status === "building" || build.status === "queued"
                            ? getElapsedTime(build.createdAt)
                            : formatDuration(build.duration)}
                        </span>
                      </div>
                      <span className="text-zinc-400 hidden sm:inline">
                        by {build.commit.author}
                      </span>
                    </div>

                    {/* Kebab Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === build._id ? null : build._id)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                      >
                        {rollingBack === build._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        ) : (
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {openMenu === build._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-zinc-200 rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(build.commit.sha);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy SHA
                            </button>
                            {build.status === "ready" && !build.isCurrent && (
                              <button
                                onClick={() => {
                                  handleRollback(build._id);
                                  setOpenMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Rollback
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
