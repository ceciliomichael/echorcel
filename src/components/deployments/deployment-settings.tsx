"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FrameworkSelect } from "@/components/ui/framework-select";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import type { Deployment, FrameworkPreset, DeploymentStatus } from "@/types/deployment";
import { FRAMEWORK_PRESETS } from "@/types/deployment";
import {
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Globe,
} from "lucide-react";

interface DeploymentSettingsProps {
  deployment: Deployment;
  onUpdate: () => void;
}

export function DeploymentSettings({ deployment, onUpdate }: DeploymentSettingsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: deployment.name,
    branch: deployment.branch,
    rootDirectory: deployment.rootDirectory || "",
    framework: deployment.framework as FrameworkPreset,
    buildCommand: deployment.buildCommand,
    installCommand: deployment.installCommand,
    startCommand: deployment.startCommand,
    outputDirectory: deployment.outputDirectory,
    port: deployment.port,
    envVariablesRaw: deployment.envVariables
      ?.map((env) => `${env.key}=${env.value}`)
      .join("\n") || "",
  });

  useEffect(() => {
    setFormData({
      name: deployment.name,
      branch: deployment.branch,
      rootDirectory: deployment.rootDirectory || "",
      framework: deployment.framework as FrameworkPreset,
      buildCommand: deployment.buildCommand,
      installCommand: deployment.installCommand,
      startCommand: deployment.startCommand,
      outputDirectory: deployment.outputDirectory,
      port: deployment.port,
      envVariablesRaw: deployment.envVariables
        ?.map((env) => `${env.key}=${env.value}`)
        .join("\n") || "",
    });
  }, [deployment]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const envVariables = formData.envVariablesRaw
        .split("\n")
        .filter((line) => line.includes("="))
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return { key: key.trim(), value: rest.join("=").trim() };
        });

      await fetch(`/api/deployments/${deployment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, envVariables }),
      });

      onUpdate();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/deployments?id=${deployment._id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleDeploy = async () => {
    setActionLoading("deploy");
    try {
      await fetch(`/api/deployments/${deployment._id}/deploy`, { method: "POST" });
      onUpdate();
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading("stop");
    try {
      await fetch(`/api/deployments/${deployment._id}/stop`, { method: "POST" });
      onUpdate();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    setActionLoading("restart");
    try {
      await fetch(`/api/deployments/${deployment._id}/restart`, { method: "POST" });
      onUpdate();
    } finally {
      setActionLoading(null);
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
    return <Badge variant={variants[status]} dot>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" description="Deploy, stop, or restart your application" />
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">Status:</span>
              {getStatusBadge(deployment.status)}
            </div>
            {deployment.status === "running" && deployment.previewUrl && (
              <a
                href={deployment.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700"
              >
                <Globe className="w-4 h-4" />
                localhost:{deployment.port}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {deployment.status === "running" ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleRestart} disabled={!!actionLoading}>
                  {actionLoading === "restart" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
                  Redeploy
                </Button>
                <Button variant="secondary" size="sm" onClick={handleStop} disabled={!!actionLoading}>
                  {actionLoading === "stop" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                  Stop
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleDeploy} disabled={!!actionLoading}>
                {actionLoading === "deploy" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {deployment.status === "failed" ? "Retry" : "Deploy"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader title="General" description="Basic configuration" />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
            <Input label="Branch" value={formData.branch} onChange={(e) => updateField("branch", e.target.value)} />
            <Input label="Root Directory" value={formData.rootDirectory} onChange={(e) => updateField("rootDirectory", e.target.value)} placeholder="./" />
            <Input label="Port" type="number" value={formData.port} onChange={(e) => updateField("port", parseInt(e.target.value) || 3000)} />
          </div>
        </CardContent>
      </Card>

      {/* Build */}
      <Card>
        <CardHeader title="Build" description="Build commands and output" />
        <CardContent>
          <div className="space-y-4">
            <FrameworkSelect
              value={formData.framework}
              onChange={(framework) => {
                const preset = FRAMEWORK_PRESETS[framework];
                setFormData((prev) => ({
                  ...prev,
                  framework,
                  buildCommand: preset.buildCommand,
                  installCommand: preset.installCommand,
                  startCommand: preset.startCommand,
                  outputDirectory: preset.outputDir,
                  port: preset.defaultPort,
                }));
              }}
              label="Framework"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Install Command" value={formData.installCommand} onChange={(e) => updateField("installCommand", e.target.value)} />
              <Input label="Build Command" value={formData.buildCommand} onChange={(e) => updateField("buildCommand", e.target.value)} />
              <Input label="Start Command" value={formData.startCommand} onChange={(e) => updateField("startCommand", e.target.value)} />
              <Input label="Output Directory" value={formData.outputDirectory} onChange={(e) => updateField("outputDirectory", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment */}
      <Card>
        <CardHeader title="Environment Variables" description="Securely stored variables" />
        <CardContent>
          <Textarea
            placeholder="KEY=value&#10;DATABASE_URL=..."
            rows={5}
            value={formData.envVariablesRaw}
            onChange={(e) => updateField("envVariablesRaw", e.target.value)}
            hint="One per line: KEY=value"
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <Card variant="outlined" className="border-red-200">
        <CardHeader title="Danger Zone" />
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900">Delete Deployment</p>
                <p className="text-sm text-zinc-500">Permanently remove this deployment.</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        projectName={deployment.name}
      />
    </div>
  );
}
