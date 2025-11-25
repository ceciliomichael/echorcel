"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, icon, variant = "default" }: StatCardProps) {
  const iconVariants = {
    default: "text-accent-600 bg-accent-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    danger: "text-red-600 bg-red-50",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 p-4 sm:p-5",
        "bg-white shadow-card hover:shadow-card-hover transition-shadow"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", iconVariants[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
