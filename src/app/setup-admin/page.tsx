"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Boxes, Loader2, ShieldCheck } from "lucide-react";

export default function SetupAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();

        if (data.hasAdmin) {
          router.replace("/login");
        } else {
          setIsLoading(false);
        }
      } catch (_error) {
        setIsLoading(false);
      }
    };

    checkAdminExists();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create admin account");
        setIsSubmitting(false);
        return;
      }

      router.replace("/");
    } catch (_error) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12 sm:py-16 lg:py-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-lifted p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent-600 flex items-center justify-center shadow-soft mb-4">
              <Boxes className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Welcome to Echorcel</h1>
            <p className="text-zinc-500 mt-2 text-center">
              Create your admin account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username"
              label="Username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              minLength={3}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter password"
              hint="Must be at least 8 characters"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={8}
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              minLength={8}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
