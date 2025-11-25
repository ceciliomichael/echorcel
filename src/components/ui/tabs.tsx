"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface Tab {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  className?: string;
}

export function Tabs({ tabs, className }: TabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("border-b border-zinc-200", className)}>
      <nav className="flex gap-1 -mb-px overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || 
            (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "border-b-2 transition-colors duration-150",
                isActive
                  ? "text-accent-600 border-accent-500"
                  : "text-zinc-500 border-transparent hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

interface TabButtonsProps {
  tabs: { label: string; value: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TabButtons({ tabs, value, onChange, className }: TabButtonsProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-lg bg-zinc-100 border border-zinc-200",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md",
            "transition-all duration-150",
            value === tab.value
              ? "bg-white text-zinc-900 shadow-soft"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
