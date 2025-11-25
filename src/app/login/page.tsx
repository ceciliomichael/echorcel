"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Boxes, Loader2, LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();

        if (!data.hasAdmin) {
          router.replace("/setup-admin");
        } else if (data.isAuthenticated) {
          router.replace("/");
        } else {
          setIsLoading(false);
        }
      } catch (_error) {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
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
            <h1 className="text-2xl font-bold text-zinc-900">Welcome Back</h1>
            <p className="text-zinc-500 mt-2 text-center">
              Sign in to your Echorcel dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="w-full">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className={cn(
                    "w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-lg border text-zinc-900",
                    "bg-white border-zinc-200 placeholder-zinc-400",
                    "transition-all duration-150",
                    "hover:border-zinc-300",
                    "focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
                  )}
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="w-full">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={cn(
                    "w-full pl-9 pr-10 py-2.5 min-h-[44px] rounded-lg border text-zinc-900",
                    "bg-white border-zinc-200 placeholder-zinc-400",
                    "transition-all duration-150",
                    "hover:border-zinc-300",
                    "focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
                  )}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

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
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
