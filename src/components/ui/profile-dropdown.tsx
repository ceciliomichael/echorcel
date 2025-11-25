"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
  username?: string;
  className?: string;
}

export function ProfileDropdown({ username, className }: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (_error) {
      setIsLoggingOut(false);
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  const initial = username?.charAt(0).toUpperCase() || "A";

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg",
          "bg-white border border-zinc-200 shadow-soft",
          "transition-all duration-150 btn-3d",
          "hover:border-zinc-300 min-h-[36px]"
        )}
        aria-label="Profile menu"
      >
        <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">{initial}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-zinc-500 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-60 rounded-xl overflow-hidden",
            "bg-white border border-zinc-200",
            "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* User Info Section */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent-600 flex items-center justify-center border-2 border-accent-500">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {username || "Admin"}
                </p>
                <p className="text-xs text-zinc-500">Administrator</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1.5">
            <div className="bg-white rounded-lg border border-zinc-200">
              <button
                onClick={handleSettings}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg",
                  "text-zinc-700 hover:bg-zinc-50",
                  "transition-colors duration-100"
                )}
              >
                <Settings className="w-4 h-4 text-zinc-500" />
                <span>Settings</span>
              </button>
            </div>

            <div className="bg-red-50 rounded-lg border border-red-200">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg",
                  "text-red-600 hover:bg-red-100",
                  "transition-colors duration-100",
                  isLoggingOut && "opacity-50 cursor-not-allowed"
                )}
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
