"use client";

import { cn } from "@/lib/utils";
import { Github, Shield, Info } from "lucide-react";

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
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 sm:border-b sm:border-zinc-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg sm:rounded-none sm:rounded-t-lg",
              isActive
                ? "bg-white text-zinc-900 sm:border sm:border-b-0 sm:border-zinc-200 sm:-mb-px"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 sm:hover:bg-transparent"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export { tabs };
