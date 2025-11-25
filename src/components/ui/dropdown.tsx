"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] py-1.5 rounded-lg border border-zinc-200",
            "bg-white shadow-lifted",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left",
                "transition-colors duration-100",
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-zinc-700 hover:bg-zinc-50",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DropdownButtonProps {
  children: ReactNode;
  items: DropdownItem[];
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export function DropdownButton({
  children,
  items,
  variant = "secondary",
  size = "md",
  className,
}: DropdownButtonProps) {
  const variants = {
    primary: "bg-accent-600 text-white border-accent-600 hover:bg-accent-700",
    secondary: "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-soft",
    ghost: "bg-transparent text-zinc-600 border-transparent hover:bg-zinc-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-sm min-h-[44px]",
  };

  return (
    <Dropdown
      trigger={
        <div
          className={cn(
            "inline-flex items-center justify-center gap-2 font-medium rounded-lg border",
            "transition-all duration-150 btn-3d",
            variants[variant],
            sizes[size],
            className
          )}
        >
          {children}
          <ChevronDown className="w-4 h-4" />
        </div>
      }
      items={items}
      className={className}
    />
  );
}
