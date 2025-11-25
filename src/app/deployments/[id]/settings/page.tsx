"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EnvEditor } from "@/components/ui/env-editor";
import type { Deployment, FrameworkPreset, EnvVariable } from "@/types/deployment";
import { FRAMEWORK_PRESETS } from "@/types/deployment";
import { Badge } from "@/components/ui/badge";
import type { DeploymentStatus } from "@/types/deployment";
import {
  Boxes,
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Globe,
} from "lucide-react";

const frameworkOptions = Object.entries(FRAMEWORK_PRESETS).map(([key, value]) => ({
  value: key,
  label: value.name,
}));

export default function DeploymentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    rootDirectory: "",
    framework: "nextjs" as FrameworkPreset,
    buildCommand: "",
    installCommand: "",
    startCommand: "",
    outputDirectory: "",
    port: 3000,
    envVariables: [] as EnvVariable[],
  });

  const fetchDeployment = useCallback(async (updateForm = true) => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}`);
      if (res.ok) {
        const data = await res.json();
        setDeployment(data);
        // Only update form data on initial load or after save
        if (updateForm) {
          setFormData({
            name: data.name,
            branch: data.branch,
            rootDirectory: data.rootDirectory || "",
            framework: data.framework,
            buildCommand: data.buildCommand,
            installCommand: data.installCommand,
            startCommand: data.startCommand,
            outputDirectory: data.outputDirectory,
            port: data.port,
            envVariables: data.envVariables || [],
          });
        }
      }
    } catch (_error) {
      console.error("Failed to fetch deployment");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  // Poll for status only (don't reset form)
  const pollStatus = useCallback(async () => {
    await fetchDeployment(false);
  }, [fetchDeployment]);

  useEffect(() => {
    fetchDeployment(true); // Initial load with form data
    // Poll for status updates only (don't overwrite form)
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchDeployment, pollStatus]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty env variables
      const envVariables = formData.envVariables.filter((v) => v.key.trim());

      await fetch(`/api/deployments/${deploymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          envVariables,
        }),
      });

      fetchDeployment(true); // Refresh form after save
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deployment? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/deployments?id=${deploymentId}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeploy = async () => {
    setActionLoading("deploy");
    try {
      await fetch(`/api/deployments/${deploymentId}/deploy`, { method: "POST" });
      router.push(`/deployments/${deploymentId}/deploying`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async () => {
    setActionLoading("start");
    try {
      await fetch(`/api/deployments/${deploymentId}/start`, { method: "POST" });
      fetchDeployment(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading("stop");
    try {
      await fetch(`/api/deployments/${deploymentId}/stop`, { method: "POST" });
      fetchDeployment(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    setActionLoading("restart");
    try {
      await fetch(`/api/deployments/${deploymentId}/restart`, { method: "POST" });
      fetchDeployment(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Deployment not found</p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-600 flex items-center justify-center shadow-soft">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900">Echorcel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Back Link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href={`/deployments/${deploymentId}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {deployment.name}
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 mb-8">Manage Deployment</h1>

        <div className="space-y-6">
          {/* Deployment Status & Actions */}
          <Card>
            <CardHeader
              title="Deployment Status"
              description="Current status and quick actions"
            />
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
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
              </div>

              <div className="flex flex-wrap gap-3">
                {deployment.status === "running" ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleDeploy}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "deploy" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="w-4 h-4 mr-2" />
                      )}
                      Redeploy
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleRestart}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "restart" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="w-4 h-4 mr-2" />
                      )}
                      Restart
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleStop}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "stop" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      Stop
                    </Button>
                  </>
                ) : deployment.status === "stopped" && deployment.containerId ? (
                  <>
                    <Button
                      onClick={handleStart}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "start" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleDeploy}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "deploy" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="w-4 h-4 mr-2" />
                      )}
                      Redeploy
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleDeploy}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "deploy" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {deployment.status === "failed" ? "Retry Deploy" : "Deploy"}
                  </Button>
                )}
                <Link href={`/deployments/${deploymentId}`}>
                  <Button variant="ghost">View Logs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader
              title="General"
              description="Basic deployment configuration"
            />
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Deployment Name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  <Input
                    label="Branch"
                    value={formData.branch}
                    onChange={(e) => updateField("branch", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Root Directory"
                    value={formData.rootDirectory}
                    onChange={(e) => updateField("rootDirectory", e.target.value)}
                    placeholder="./"
                  />
                  <Input
                    label="Port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => updateField("port", parseInt(e.target.value) || 3000)}
                  />
                </div>
                <Select
                  label="Framework"
                  options={frameworkOptions}
                  value={formData.framework}
                  onChange={(e) => updateField("framework", e.target.value as FrameworkPreset)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Build Settings */}
          <Card>
            <CardHeader
              title="Build & Output"
              description="Configure build commands and output settings"
            />
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Install Command"
                  value={formData.installCommand}
                  onChange={(e) => updateField("installCommand", e.target.value)}
                  placeholder="npm install"
                />
                <Input
                  label="Build Command"
                  value={formData.buildCommand}
                  onChange={(e) => updateField("buildCommand", e.target.value)}
                  placeholder="npm run build"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Output Directory"
                    value={formData.outputDirectory}
                    onChange={(e) => updateField("outputDirectory", e.target.value)}
                    placeholder=".next"
                  />
                  <Input
                    label="Start Command"
                    value={formData.startCommand}
                    onChange={(e) => updateField("startCommand", e.target.value)}
                    placeholder="npm start"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader
              title="Environment Variables"
              description="Configure environment variables for your deployment"
            />
            <CardContent>
              <EnvEditor
                variables={formData.envVariables}
                onChange={(vars) => updateField("envVariables", vars)}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card variant="outlined" className="border-red-200">
            <CardHeader
              title="Danger Zone"
              description="Irreversible actions"
            />
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-900">Delete Deployment</p>
                    <p className="text-sm text-zinc-500">
                      This will permanently delete this deployment and all associated data.
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-shrink-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
