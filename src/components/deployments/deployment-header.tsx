"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import type { Deployment, DeploymentStatus } from "@/types/deployment";
import {
  ArrowLeft,
  ExternalLink,
  MoreVertical,
  Play,
  Square,
  RotateCw,
  Trash2,
  Settings,
  GitBranch,
} from "lucide-react";

interface DeploymentHeaderProps {
  deployment: Deployment;
  onDeploy: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function DeploymentHeader({
  deployment,
  onDeploy,
  onStop,
  onRestart,
  onDelete,
  isLoading,
}: DeploymentHeaderProps) {
  const getStatusBadge = (status: DeploymentStatus) => {
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

  const getDropdownItems = () => {
    const items = [];

    if (deployment.status === "running") {
      items.push(
        {
          label: "Restart",
          icon: <RotateCw className="w-4 h-4" />,
          onClick: onRestart,
          disabled: isLoading,
        },
        {
          label: "Stop",
          icon: <Square className="w-4 h-4" />,
          onClick: onStop,
          disabled: isLoading,
        }
      );
    } else if (["pending", "failed", "stopped"].includes(deployment.status)) {
      items.push({
        label: "Deploy",
        icon: <Play className="w-4 h-4" />,
        onClick: onDeploy,
        disabled: isLoading,
      });
    }

    items.push(
      {
        label: "Settings",
        icon: <Settings className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: onDelete,
        variant: "danger" as const,
        disabled: isLoading,
      }
    );

    return items;
  };

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deployments
        </Link>

        {/* Header Content */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
                  {deployment.name}
                </h1>
                {getStatusBadge(deployment.status)}
              </div>
              <p className="text-sm text-zinc-500 truncate max-w-md">
                {deployment.gitUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deployment.status === "running" && deployment.previewUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(deployment.previewUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit
              </Button>
            )}
            <Dropdown
              trigger={
                <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              items={getDropdownItems()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
