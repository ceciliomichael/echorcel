"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TabButtons } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeploymentOverview } from "@/components/deployments/deployment-overview";
import { DeploymentLogs } from "@/components/deployments/deployment-logs";
import { DeploymentSettings } from "@/components/deployments/deployment-settings";
import { DeploymentHistory } from "@/components/deployments/deployment-history";
import { WebhookSettings } from "@/components/deployments/deployment-webhooks";
import type { Deployment, DeploymentStatus } from "@/types/deployment";
import {
  Loader2,
  FileText,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  GitBranch,
  Rocket,
  Webhook,
} from "lucide-react";
import { Header } from "@/components/layout/header";

const tabs = [
  { label: "Overview", value: "overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Deployments", value: "deployments", icon: <Rocket className="w-4 h-4" /> },
  { label: "Logs", value: "logs", icon: <FileText className="w-4 h-4" /> },
  { label: "Webhook", value: "webhook", icon: <Webhook className="w-4 h-4" /> },
  { label: "Settings", value: "settings", icon: <Settings className="w-4 h-4" /> },
];

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deploymentId = params.id as string;
  const initialTab = searchParams.get("tab") || "overview";

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  const fetchDeployment = useCallback(async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}`);
      if (res.ok) {
        setDeployment(await res.json());
      }
    } catch (_error) {
      console.error("Failed to fetch deployment");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDeployment();
    const interval = setInterval(fetchDeployment, 3000);
    return () => clearInterval(interval);
  }, [fetchDeployment]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview", "deployments", "logs", "webhook", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
        <Button variant="secondary" onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />

      {/* Project Header */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Deployments
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">{deployment.name}</h1>
                {getStatusBadge(deployment.status)}
              </div>
              <p className="text-sm text-zinc-500 truncate max-w-md">{deployment.gitUrl}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabButtons
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        {activeTab === "overview" && <DeploymentOverview deployment={deployment} />}
        {activeTab === "deployments" && <DeploymentHistory deploymentId={deploymentId} gitUrl={deployment.gitUrl} />}
        {activeTab === "logs" && <DeploymentLogs deploymentId={deploymentId} status={deployment.status} />}
        {activeTab === "webhook" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Webhook Settings</h2>
              <p className="text-sm text-zinc-500 mt-1">Configure automatic deployments when you push to your repository</p>
            </div>
            <WebhookSettings deploymentId={deploymentId} />
          </div>
        )}
        {activeTab === "settings" && <DeploymentSettings deployment={deployment} onUpdate={fetchDeployment} />}
      </div>
    </div>
  );
}
