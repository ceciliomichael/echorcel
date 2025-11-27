"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { GitHubOAuthConfig } from "@/components/settings/github-oauth-config";
import { GitHubConnection } from "@/components/settings/github-connection";
import { PasswordChange } from "@/components/settings/password-change";

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("integrations");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);

    const github = searchParams.get("github");
    const error = searchParams.get("error");

    if (github === "connected") {
      setNotification({ type: "success", text: "GitHub connected successfully!" });
      window.history.replaceState({}, "", "/settings?tab=integrations");
    } else if (error === "not_configured") {
      setNotification({ type: "error", text: "Configure GitHub OAuth credentials first" });
      window.history.replaceState({}, "", "/settings?tab=integrations");
    } else if (error) {
      setNotification({ type: "error", text: `Connection failed: ${error}` });
      window.history.replaceState({}, "", "/settings?tab=integrations");
    }
  }, [searchParams]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <Header />

      {/* Toast */}
      {notification && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {notification.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm font-medium">{notification.text}</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 mb-6">Settings</h1>

        {/* Tabs */}
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl sm:rounded-tr-xl border border-zinc-200 border-t-0 sm:border-t p-6 sm:p-8">
          {activeTab === "integrations" && (
            <div className="space-y-8">
              {/* OAuth Config */}
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">OAuth Configuration</h2>
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-5">
                  <GitHubOAuthConfig />
                </div>
              </section>

              {/* Account Connection */}
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Connected Account</h2>
                <GitHubConnection />
              </section>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Authentication</h2>
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-5">
                  <PasswordChange />
                </div>
              </section>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Application Info</h2>
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 divide-y divide-zinc-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-5 py-4">
                    <span className="text-sm text-zinc-600">Application</span>
                    <span className="text-sm font-semibold text-zinc-900">Echorcel</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-5 py-4">
                    <span className="text-sm text-zinc-600">Version</span>
                    <span className="text-sm font-mono text-zinc-900">1.0.0</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-5 py-4">
                    <span className="text-sm text-zinc-600">Environment</span>
                    <Badge variant="default">
                      {process.env.NODE_ENV === "production" ? "Production" : "Development"}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-5 py-4">
                    <span className="text-sm text-zinc-600">App URL</span>
                    <span className="text-sm font-mono text-zinc-900 break-all">
                      {typeof window !== "undefined" ? window.location.origin : ""}
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Description</h2>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Echorcel is a self-hosted deployment platform that lets you deploy your applications 
                  from Git repositories to Docker containers. Connect your GitHub account to browse 
                  repositories, set up webhooks for auto-deploy, and manage your deployments with ease.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-500">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

