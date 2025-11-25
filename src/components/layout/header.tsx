"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Boxes, Loader2 } from "lucide-react";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";

export function Header() {
  const [dockerConnected, setDockerConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    checkDocker();
    fetchAuthStatus();
  }, []);

  const checkDocker = async () => {
    try {
      const res = await fetch("/api/docker/status");
      const data = await res.json();
      setDockerConnected(data.connected);
    } catch (_error) {
      setDockerConnected(false);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.isAuthenticated) {
        setUsername(data.username || "Admin");
      }
    } catch (_error) {
      console.error("Failed to fetch auth status");
    }
  };

  return (
    <header className="border-b border-zinc-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-600 flex items-center justify-center shadow-soft">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">Echorcel</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Docker Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
              {dockerConnected === null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${dockerConnected ? "bg-emerald-500" : "bg-red-500"}`} />
              )}
              <span className="text-xs font-medium text-zinc-600">
                {dockerConnected === null ? "Checking..." : dockerConnected ? "Docker" : "Disconnected"}
              </span>
            </div>

            {/* Profile */}
            {username && <ProfileDropdown username={username} />}
          </div>
        </div>
      </div>
    </header>
  );
}
