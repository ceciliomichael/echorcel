"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Github, Shield, Info, ChevronDown, Check } from "lucide-react";

const tabs = [
  { id: "integrations", label: "Integrations", icon: Github },
  { id: "security", label: "Security", icon: Shield },
  { id: "about", label: "About", icon: Info },
];

interface SettingsTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeTabData = tabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon || Github;

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="sm:hidden relative mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] bg-white border border-zinc-200 rounded-xl text-left shadow-soft"
        >
          <div className="flex items-center gap-3">
            <ActiveIcon className="w-5 h-5 text-accent-600" />
            <span className="font-medium text-zinc-900">{activeTabData?.label}</span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onChange(tab.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left transition-colors",
                      activeTab === tab.id
                        ? "bg-accent-50 text-accent-700"
                        : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 font-medium">{tab.label}</span>
                    {activeTab === tab.id && <Check className="w-5 h-5 text-accent-600" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className="hidden sm:flex sm:border-b sm:border-zinc-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg",
                isActive
                  ? "bg-white text-zinc-900 border border-b-0 border-zinc-200 -mb-px"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export { tabs };
