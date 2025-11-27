"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, RotateCw } from "lucide-react";
import type { RestartPolicy } from "@/types/deployment";
import { RESTART_POLICIES } from "@/types/deployment";

interface RestartPolicySelectProps {
  value: RestartPolicy;
  onChange: (value: RestartPolicy) => void;
  label?: string;
  className?: string;
}

export function RestartPolicySelect({
  value,
  onChange,
  label,
  className,
}: RestartPolicySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPolicy = RESTART_POLICIES.find((p) => p.value === value);

  return (
    <div className={cn("w-full", isOpen && "mb-[240px]", className)}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] bg-white border border-zinc-200 rounded-lg text-left hover:border-zinc-300 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <RotateCw className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 text-sm">{selectedPolicy?.label}</p>
              <p className="text-xs text-zinc-500 truncate">{selectedPolicy?.description}</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
              {RESTART_POLICIES.map((policy) => (
                <button
                  key={policy.value}
                  type="button"
                  onClick={() => {
                    onChange(policy.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left transition-colors",
                    value === policy.value
                      ? "bg-accent-50"
                      : "hover:bg-zinc-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      value === policy.value
                        ? "bg-accent-100 text-accent-600"
                        : "bg-zinc-100 text-zinc-500"
                    )}
                  >
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-sm",
                        value === policy.value ? "text-accent-700" : "text-zinc-900"
                      )}
                    >
                      {policy.label}
                    </p>
                    <p className="text-xs text-zinc-500">{policy.description}</p>
                  </div>
                  {value === policy.value && (
                    <Check className="w-5 h-5 text-accent-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
