"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import type { Deployment, DeploymentStatus } from "@/types/deployment";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  ExternalLink,
  FileText,
  GitBranch,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

interface DeploymentListProps {
  deployments: Deployment[];
  onDeploy: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRestart: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DeploymentList({
  deployments,
  onDeploy,
  onStop,
  onRestart,
  onDelete,
}: DeploymentListProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<{
    id: string;
    action: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deployment | null>(null);

  const handleAction = async (
    id: string,
    action: string,
    handler: (id: string) => Promise<void>
  ) => {
    setLoadingAction({ id, action });
    try {
      await handler(id);
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = (status: DeploymentStatus) => {
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

  const isLoading = (id: string, action: string) =>
    loadingAction?.id === id && loadingAction?.action === action;

  if (deployments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-card">
        <p className="text-zinc-600 text-lg">No deployments yet</p>
        <p className="text-zinc-500 text-sm mt-1">
          Click &quot;New Deployment&quot; to get started
        </p>
      </div>
    );
  }

  const renderActions = (deployment: Deployment) => (
    <div className="flex items-center">
      <Link
        href={`/deployments/${deployment._id}`}
        title="Dashboard"
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-accent-600 transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
      </Link>
      <button
        onClick={() => router.push(`/deployments/${deployment._id}?tab=logs`)}
        title="View Logs"
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-accent-600 transition-colors"
      >
        <FileText className="w-4 h-4" />
      </button>

      {deployment.status === "pending" ||
      deployment.status === "failed" ||
      deployment.status === "stopped" ? (
        <button
          onClick={() => handleAction(deployment._id!, "deploy", onDeploy)}
          disabled={!!loadingAction}
          title="Deploy"
          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          {isLoading(deployment._id!, "deploy") ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
      ) : deployment.status === "running" ? (
        <>
          <button
            onClick={() => handleAction(deployment._id!, "restart", onRestart)}
            disabled={!!loadingAction}
            title="Restart"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-50"
          >
            {isLoading(deployment._id!, "restart") ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleAction(deployment._id!, "stop", onStop)}
            disabled={!!loadingAction}
            title="Stop"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
          >
            {isLoading(deployment._id!, "stop") ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </>
      ) : null}

      <button
        onClick={() => setDeleteTarget(deployment)}
        disabled={!!loadingAction}
        title="Delete"
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-3">
        {deployments.map((deployment) => (
          <div
            key={deployment._id}
            className="bg-white rounded-xl border border-zinc-200 shadow-soft overflow-hidden"
          >
            <Link
              href={`/deployments/${deployment._id}`}
              className="flex items-start gap-3 p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900 truncate">{deployment.name}</h3>
                  {getStatusBadge(deployment.status)}
                </div>
                <p className="text-xs text-zinc-500 truncate mb-2">{deployment.gitUrl}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>{new Date(deployment.createdAt).toLocaleDateString()}</span>
                  {deployment.status === "running" && (
                    <span className="text-accent-600">Port {deployment.port}</span>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
              {deployment.status === "running" ? (
                <a
                  href={getPreviewUrl(deployment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-accent-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Site
                </a>
              ) : (
                <span className="text-sm text-zinc-400">Not running</span>
              )}
              {renderActions(deployment)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden sm:block bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                App Name
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                Preview
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                Created
              </th>
              <th className="text-right px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {deployments.map((deployment) => (
              <tr key={deployment._id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/deployments/${deployment._id}`} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-100 transition-colors">
                      <GitBranch className="w-5 h-5 text-accent-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 truncate group-hover:text-accent-700 transition-colors">
                        {deployment.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                        {deployment.gitUrl}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(deployment.status)}
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {deployment.status === "running" ? (
                    <a
                      href={getPreviewUrl(deployment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:text-accent-700 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">
                        {getPreviewUrl(deployment)}
                      </span>
                    </a>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-zinc-500 text-sm">
                    {new Date(deployment.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    {renderActions(deployment)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await onDelete(deleteTarget._id!);
            setDeleteTarget(null);
          }}
          projectName={deleteTarget.name}
        />
      )}
    </>
  );
}

function getPreviewUrl(deployment: Deployment): string {
  const localUrl = deployment.previewUrl || `http://localhost:${deployment.port}`;

  if (typeof window === "undefined") {
    return localUrl;
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname.startsWith("127.");

  if (!isLocalhost && deployment.publicUrl) {
    return deployment.publicUrl;
  }

  return localUrl;
}
