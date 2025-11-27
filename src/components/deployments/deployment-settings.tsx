"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FrameworkSelect } from "@/components/ui/framework-select";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { EnvEditor } from "@/components/ui/env-editor";
import type { Deployment, FrameworkPreset, DeploymentStatus, RestartPolicy } from "@/types/deployment";
import { FRAMEWORK_PRESETS, RESTART_POLICIES } from "@/types/deployment";
import { Select } from "@/components/ui/select";
import {
  Loader2,
  Trash2,
  AlertTriangle,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Globe,
  Check,
  Save,
} from "lucide-react";

interface DeploymentSettingsProps {
  deployment: Deployment;
  onUpdate: () => void;
}

export function DeploymentSettings({ deployment, onUpdate }: DeploymentSettingsProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    deployment.previewUrl || `http://localhost:${deployment.port}`
  );

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
    restartPolicy: (deployment.restartPolicy || "always") as RestartPolicy,
    envVariables: deployment.envVariables || [],
  });

  // Only update form on initial mount (deployment._id change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      restartPolicy: (deployment.restartPolicy || "always") as RestartPolicy,
      envVariables: deployment.envVariables || [],
    });
  }, [deployment._id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname.startsWith("127.");
    const localUrl = deployment.previewUrl || `http://localhost:${deployment.port}`;

    if (!isLocalhost && deployment.publicUrl) {
      setPreviewUrl(deployment.publicUrl);
    } else {
      setPreviewUrl(localUrl);
    }
  }, [deployment.previewUrl, deployment.publicUrl, deployment.port]);

  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);
    try {
      const envVariables = formData.envVariables.filter((v) => v.key.trim());
      await fetch(`/api/deployments/${deployment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, envVariables }),
      });
      onUpdate();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (_error) {
      console.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    await fetch(`/api/deployments?id=${deployment._id}`, { method: "DELETE" });
    router.push("/");
  };

  const handleDeploy = async () => {
    setActionLoading("deploy");
    try {
      await fetch(`/api/deployments/${deployment._id}/deploy`, { method: "POST" });
      router.push(`/deployments/${deployment._id}/deploying`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async () => {
    setActionLoading("start");
    try {
      await fetch(`/api/deployments/${deployment._id}/start`, { method: "POST" });
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
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Configuration</h2>
          <p className="text-sm text-zinc-500">Manage your deployment settings</p>
        </div>
        <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto transition-all duration-200"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save Changes"}
          </Button>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" description="Deploy, stop, or restart your application" />
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">Status:</span>
              {getStatusBadge(deployment.status)}
            </div>
            {deployment.status === "running" && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700"
              >
                <Globe className="w-4 h-4" />
                {previewUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {deployment.status === "running" ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleDeploy} disabled={!!actionLoading}>
                  {actionLoading === "deploy" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
                  Redeploy
                </Button>
                <Button variant="secondary" size="sm" onClick={handleRestart} disabled={!!actionLoading}>
                  {actionLoading === "restart" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
                  Restart
                </Button>
                <Button variant="secondary" size="sm" onClick={handleStop} disabled={!!actionLoading}>
                  {actionLoading === "stop" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                  Stop
                </Button>
              </>
            ) : deployment.status === "stopped" && deployment.containerId ? (
              <>
                <Button size="sm" onClick={handleStart} disabled={!!actionLoading}>
                  {actionLoading === "start" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Start
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDeploy} disabled={!!actionLoading}>
                  {actionLoading === "deploy" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
                  Redeploy
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
          <EnvEditor
            variables={formData.envVariables}
            onChange={(vars) => updateField("envVariables", vars)}
          />
        </CardContent>
      </Card>

      {/* Container */}
      <Card>
        <CardHeader title="Container" description="Docker container settings" />
        <CardContent>
          <Select
            label="Restart Policy"
            options={RESTART_POLICIES.map((p) => ({ value: p.value, label: `${p.label} - ${p.description}` }))}
            value={formData.restartPolicy}
            onChange={(e) => updateField("restartPolicy", e.target.value as RestartPolicy)}
            hint="Controls when the container should automatically restart"
          />
        </CardContent>
      </Card>

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
