"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { DeploymentList } from "@/components/deployments/deployment-list";
import type { Deployment, DeploymentStats } from "@/types/deployment";
import {
  Plus,
  LayoutGrid,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Boxes,
  Hammer,
} from "lucide-react";

export default function Home() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<DeploymentStats>({
    total: 0,
    active: 0,
    building: 0,
    failed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dockerConnected, setDockerConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);

  const fetchDeployments = useCallback(async () => {
    try {
      const res = await fetch("/api/deployments");
      const data = await res.json();
      setDeployments(data.deployments || []);
      setStats(data.stats || { total: 0, active: 0, building: 0, failed: 0 });
    } catch (_error) {
      console.error("Failed to fetch deployments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkDockerStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/docker/status");
      const data = await res.json();
      setDockerConnected(data.connected);
    } catch (_error) {
      setDockerConnected(false);
    }
  }, []);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setUsername(data.username);
    } catch (_error) {
      // Ignore auth status errors
    }
  }, []);

  useEffect(() => {
    fetchDeployments();
    checkDockerStatus();
    fetchAuthStatus();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDeployments, 5000);
    return () => clearInterval(interval);
  }, [fetchDeployments, checkDockerStatus, fetchAuthStatus]);

  const handleDeploy = async (id: string) => {
    await fetch(`/api/deployments/${id}/deploy`, { method: "POST" });
    fetchDeployments();
  };

  const handleStop = async (id: string) => {
    await fetch(`/api/deployments/${id}/stop`, { method: "POST" });
    fetchDeployments();
  };

  const handleRestart = async (id: string) => {
    await fetch(`/api/deployments/${id}/restart`, { method: "POST" });
    fetchDeployments();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/deployments?id=${id}`, { method: "DELETE" });
    fetchDeployments();
  };

  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-600 flex items-center justify-center shadow-soft">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900">Echorcel</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 shadow-soft">
                <div
                  className={`w-2 h-2 rounded-full ${
                    dockerConnected === null
                      ? "bg-zinc-400"
                      : dockerConnected
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-zinc-600">
                  Docker {dockerConnected === null ? "..." : dockerConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-soft">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    dockerConnected === null
                      ? "bg-zinc-400"
                      : dockerConnected
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <ProfileDropdown username={username} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Deployments</h1>
            <p className="text-zinc-500 mt-1">Manage your Docker deployments</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={fetchDeployments} className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/deployments/new" className="flex-1 sm:flex-none">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Deployment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            label="Total Deployments"
            value={stats.total}
            icon={<LayoutGrid className="w-5 h-5" />}
            variant="default"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="success"
          />
          <StatCard
            label="Building"
            value={stats.building}
            icon={<Hammer className="w-5 h-5" />}
            variant="warning"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="danger"
          />
        </div>

        {/* Deployment List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <DeploymentList
            deployments={deployments}
            onDeploy={handleDeploy}
            onStop={handleStop}
            onRestart={handleRestart}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
