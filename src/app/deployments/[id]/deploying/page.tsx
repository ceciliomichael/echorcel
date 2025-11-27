"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DeploymentSuccess } from "@/components/deployments/deployment-success";
import type { Deployment, DeploymentStatus } from "@/types/deployment";
import { Loader2 } from "lucide-react";

export default function DeployingPage() {
  const params = useParams();
  const router = useRouter();
  const deploymentId = params.id as string;

  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<DeploymentStatus | null>(null);

  const fetchDeployment = useCallback(async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}`);
      if (res.ok) {
        const data = await res.json();
        setDeployment(data);

        // Check for status transition to running
        const prevStatus = prevStatusRef.current;
        if (
          prevStatus &&
          (prevStatus === "building" || prevStatus === "cloning") &&
          data.status === "running"
        ) {
          setShowSuccess(true);
        }
        prevStatusRef.current = data.status;
      }
    } catch (_error) {
      console.error("Failed to fetch deployment");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/logs`);
      if (res.ok) {
        const data = await res.json();
        // API returns buildLogs for stored build logs
        setLogs(data.buildLogs || []);
      }
    } catch (_error) {
      console.error("Failed to fetch logs");
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDeployment();
    fetchLogs();
    const interval = setInterval(() => {
      fetchDeployment();
      fetchLogs();
    }, 1500);
    return () => clearInterval(interval);
  }, [fetchDeployment, fetchLogs]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleContinue = () => {
    router.push(`/deployments/${deploymentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="min-h-dvh bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Deployment not found</p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  // Show success screen when deployment completes
  if (showSuccess && deployment.status === "running") {
    return (
      <DeploymentSuccess deployment={deployment} onContinue={handleContinue} />
    );
  }

  const isActive = deployment.status === "cloning" || deployment.status === "building";
  const isFailed = deployment.status === "failed";

  return (
    <div className="min-h-dvh bg-white z-50 flex items-center justify-center py-8 sm:py-12">
      {/* Gradient background - same as success */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-accent-50 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-200/30 via-accent-200/20 to-transparent blur-3xl" />

      <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 mb-4">
            <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            {isActive ? "Deploying..." : isFailed ? "Deployment Failed" : "Almost there..."}
          </h1>
          <p className="text-zinc-600">
            {deployment.status === "cloning"
              ? "Cloning repository..."
              : deployment.status === "building"
              ? "Building your application..."
              : isFailed
              ? "There was an error during deployment"
              : "Finishing up..."}
          </p>
        </div>

        {/* Terminal Frame - White container, dark inside like Logs tab */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-200 via-accent-200 to-violet-200 rounded-xl blur opacity-50" />
          <div className="relative bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-center px-4 py-3 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-700">Build Logs</span>
            </div>

            {/* Terminal Content - Dark inside */}
            <div className="h-[200px] sm:h-[280px] max-h-[50dvh] overflow-y-auto p-4 font-mono text-sm bg-zinc-900 rounded-b-lg dark-scrollbar">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for logs...</span>
                </div>
              ) : (
                logs.map((log, index) => {
                  const isError = log.toLowerCase().includes("error") || log.toLowerCase().includes("failed");
                  const isEchorcel = log.includes("[Echorcel]");
                  return (
                    <div
                      key={index}
                      className="py-0.5 text-zinc-300 whitespace-pre-wrap break-all hover:bg-zinc-800 px-1 -mx-1 rounded"
                    >
                      {isError ? (
                        <span className="text-red-400">{log}</span>
                      ) : isEchorcel ? (
                        <span className="text-accent-400">{log}</span>
                      ) : (
                        log
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mb-8">
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-600 rounded-full transition-all duration-500" 
                style={{ width: deployment.status === "cloning" ? "30%" : "70%" }} 
              />
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">
              {deployment.status === "cloning" ? "Step 1 of 2: Cloning" : "Step 2 of 2: Building"}
            </p>
          </div>
        )}

        {/* Go to Dashboard button */}
        <Button 
          variant="secondary" 
          onClick={() => router.push(`/deployments/${deploymentId}`)} 
          className="w-full"
          size="lg"
        >
          Go to Dashboard
        </Button>

        {/* Extra actions for failed */}
        {isFailed && (
          <Button
            variant="ghost"
            onClick={() => router.push(`/deployments/${deploymentId}?tab=settings`)}
            className="w-full mt-2"
          >
            View Settings
          </Button>
        )}
      </div>
    </div>
  );
}
