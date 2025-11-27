"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const activeTab = tabs.find((t) => t.value === value);

  return (
    <>
      {/* Mobile: Dropdown selector */}
      <div className={cn("sm:hidden relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] bg-white border border-zinc-200 rounded-xl text-left shadow-soft"
        >
          <div className="flex items-center gap-3">
            {activeTab?.icon && <span className="w-5 h-5 text-accent-600">{activeTab.icon}</span>}
            <span className="font-medium text-zinc-900">{activeTab?.label}</span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    onChange(tab.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left transition-colors",
                    value === tab.value
                      ? "bg-accent-50 text-accent-700"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {value === tab.value && <Check className="w-5 h-5 text-accent-600" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop: Horizontal tabs */}
      <div
        className={cn(
          "hidden sm:inline-flex p-1 rounded-lg bg-zinc-100 border border-zinc-200",
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap",
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
    </>
  );
}
