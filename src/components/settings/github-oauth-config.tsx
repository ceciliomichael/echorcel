"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Github, Loader2, Check, X, ExternalLink, Eye, EyeOff } from "lucide-react";

interface OAuthConfig {
  configured: boolean;
  clientId: string | null;
}

export function GitHubOAuthConfig() {
  const [config, setConfig] = useState<OAuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/settings/github-oauth");
      const data = await res.json();
      setConfig(data);
    } catch (_error) {
      console.error("Failed to fetch config");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setMessage({ type: "error", text: "Both fields are required" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/github-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "OAuth credentials saved!" });
        setIsEditing(false);
        setClientId("");
        setClientSecret("");
        fetchConfig();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/settings/github-oauth", { method: "DELETE" });
      setConfig({ configured: false, clientId: null });
      setMessage({ type: "success", text: "Credentials cleared" });
    } catch (_error) {
      setMessage({ type: "error", text: "Failed to clear" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900">GitHub OAuth App</h3>
            <p className="text-sm text-zinc-500">Required for GitHub integration</p>
          </div>
        </div>
        <Badge variant={config?.configured ? "success" : "warning"}>
          {config?.configured ? "Configured" : "Not configured"}
        </Badge>
      </div>

      {config?.configured && !isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
            <div>
              <p className="text-xs text-zinc-500">Client ID</p>
              <p className="text-sm font-mono text-zinc-900">{config.clientId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Update Credentials
            </Button>
            <Button variant="danger" size="sm" onClick={handleClear} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-accent-50 border border-accent-100">
            <h4 className="text-sm font-medium text-accent-900 mb-2">Setup Instructions</h4>
            <ol className="text-sm text-accent-700 space-y-1 list-decimal list-inside">
              <li>Go to GitHub → Settings → Developer settings → OAuth Apps</li>
              <li>Click "New OAuth App"</li>
              <li>Set Homepage URL to your app URL (e.g., http://localhost:3000)</li>
              <li>Set Callback URL to: <code className="px-1 py-0.5 bg-accent-100 rounded text-xs">{typeof window !== "undefined" ? window.location.origin : ""}/api/github/callback</code></li>
              <li>Copy the Client ID and generate a Client Secret</li>
            </ol>
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700 mt-3"
            >
              Open GitHub Developer Settings
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <Input
            label="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Ov23li..."
            hint="From your GitHub OAuth App"
          />

          <div className="relative">
            <Input
              label="Client Secret"
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter client secret"
              hint="Keep this secret - it's encrypted before storage"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-600"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {message && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Credentials
            </Button>
            {isEditing && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
