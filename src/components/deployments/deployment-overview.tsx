"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Deployment } from "@/types/deployment";
import {
  GitBranch,
  Folder,
  Clock,
  Globe,
  Terminal,
  Package,
} from "lucide-react";

interface DeploymentOverviewProps {
  deployment: Deployment;
}

export function DeploymentOverview({ deployment }: DeploymentOverviewProps) {
  const infoItems = [
    {
      label: "Branch",
      value: deployment.branch,
      icon: <GitBranch className="w-4 h-4" />,
    },
    {
      label: "Framework",
      value: deployment.framework,
      icon: <Package className="w-4 h-4" />,
    },
    {
      label: "Root Directory",
      value: deployment.rootDirectory || "./",
      icon: <Folder className="w-4 h-4" />,
    },
    {
      label: "Port",
      value: deployment.port.toString(),
      icon: <Globe className="w-4 h-4" />,
    },
    {
      label: "Created",
      value: new Date(deployment.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: <Clock className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Info */}
      <Card className="lg:col-span-2">
        <CardHeader title="Project Information" />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100"
              >
                <div className="p-2 rounded-md bg-white border border-zinc-200 text-zinc-500">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-zinc-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Build Commands */}
      <Card>
        <CardHeader title="Build Configuration" />
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-500">Install</span>
              </div>
              <code className="text-sm text-accent-700 font-mono">
                {deployment.installCommand || "npm install"}
              </code>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-500">Build</span>
              </div>
              <code className="text-sm text-accent-700 font-mono">
                {deployment.buildCommand || "npm run build"}
              </code>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-500">Start</span>
              </div>
              <code className="text-sm text-accent-700 font-mono">
                {deployment.startCommand || "npm start"}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card className="lg:col-span-3">
        <CardHeader
          title="Environment Variables"
          description={`${deployment.envVariables?.length || 0} variables configured`}
        />
        <CardContent>
          {deployment.envVariables && deployment.envVariables.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deployment.envVariables.map((env, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100"
                >
                  <span className="text-sm font-mono text-zinc-700">{env.key}</span>
                  <Badge variant="default">Hidden</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <p>No environment variables configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
