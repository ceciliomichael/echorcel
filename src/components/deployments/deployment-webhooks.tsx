"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Webhook,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { Webhook as WebhookType } from "@/types/webhook";

interface WebhookSettingsProps {
  deploymentId: string;
}

export function WebhookSettings({ deploymentId }: WebhookSettingsProps) {
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchWebhook = useCallback(async () => {
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/webhook`);
      const data = await res.json();
      setWebhook(data.webhook);
    } catch (_error) {
      console.error("Failed to fetch webhook");
    } finally {
      setIsLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchWebhook();
  }, [fetchWebhook]);

  const handleCreateWebhook = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/webhook`, {
        method: "POST",
      });
      const data = await res.json();
      setWebhook(data.webhook);
    } catch (_error) {
      console.error("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerateSecret = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/webhook`, {
        method: "POST",
      });
      const data = await res.json();
      setWebhook(data.webhook);
    } catch (_error) {
      console.error("Failed to regenerate secret");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleWebhook = async () => {
    if (!webhook) return;
    try {
      const res = await fetch(`/api/deployments/${deploymentId}/webhook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !webhook.enabled }),
      });
      const data = await res.json();
      setWebhook(data.webhook);
    } catch (_error) {
      console.error("Failed to toggle webhook");
    }
  };

  const handleDeleteWebhook = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/deployments/${deploymentId}/webhook`, {
        method: "DELETE",
      });
      setWebhook(null);
    } catch (_error) {
      console.error("Failed to delete webhook");
    } finally {
      setIsDeleting(false);
    }
  };

  const getWebhookUrl = () => {
    if (!webhook) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/api/webhooks/github/${webhook.secret}`;
  };

  const copyToClipboard = async () => {
    const url = getWebhookUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!webhook) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-3">
              <Webhook className="w-6 h-6 text-accent-600" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">
              Enable Auto-Deploy
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-4">
              Automatically deploy when you push to your repository.
            </p>
            <Button size="sm" onClick={handleCreateWebhook} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Webhook className="w-4 h-4 mr-2" />
                  Create Webhook
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-50 border border-accent-100 flex items-center justify-center flex-shrink-0">
              <Webhook className="w-4 h-4 text-accent-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-zinc-900 text-sm">GitHub Webhook</h3>
              <p className="text-xs text-zinc-500">
                Auto-deploy on push
              </p>
            </div>
          </div>
          <Badge variant={webhook.enabled ? "success" : "default"} dot>
            {webhook.enabled ? "Active" : "Disabled"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Payload URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 font-mono truncate">
                {getWebhookUrl()}
              </div>
              <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
            <p className="text-xs text-zinc-600 mb-2">
              Add this URL to your GitHub repository webhooks with content type <code className="px-1 py-0.5 bg-zinc-200 rounded">application/json</code>
            </p>
            <a
              href="https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
          <Button variant="secondary" size="sm" onClick={handleToggleWebhook}>
            {webhook.enabled ? "Disable" : "Enable"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRegenerateSecret} disabled={isCreating}>
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteWebhook} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
