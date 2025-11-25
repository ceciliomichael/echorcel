"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-150 btn-3d";

    const variants = {
      primary:
        "bg-accent-600 text-white border-accent-600 hover:bg-accent-700 shadow-soft",
      secondary:
        "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-soft",
      danger:
        "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-soft",
      ghost:
        "bg-transparent text-zinc-500 border-transparent hover:text-zinc-900",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-[36px]",
      md: "px-4 py-2 text-sm min-h-[44px]",
      lg: "px-6 py-3 text-base min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
