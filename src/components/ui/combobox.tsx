"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Check } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
  color?: string;
  description?: string;
}

export interface ComboboxGroup {
  label: string;
  color?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  groups?: Record<string, ComboboxGroup>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  groups,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  label,
  className,
  disabled,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.group?.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered options
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const group = opt.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, ComboboxOption[]>);

  // Flatten for keyboard navigation
  const flatOptions = Object.values(groupedOptions).flat();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      highlighted?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % flatOptions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + flatOptions.length) % flatOptions.length);
        break;
      case "Enter":
        e.preventDefault();
        if (flatOptions[highlightedIndex]) {
          onChange(flatOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearch("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 min-h-[44px]",
            "rounded-lg border text-left transition-all duration-150",
            "bg-white border-zinc-200 hover:border-zinc-300",
            isOpen && "border-accent-500 ring-1 ring-accent-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedOption ? (
              <>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedOption.color || "#6b7280" }}
                />
                <span className="text-zinc-900 truncate">{selectedOption.label}</span>
                {selectedOption.group && (
                  <span className="text-xs text-zinc-400 truncate">
                    {selectedOption.group}
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 mt-1 w-full rounded-lg border border-zinc-200",
              "bg-white shadow-lg overflow-hidden",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-zinc-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full pl-9 pr-3 py-2 text-sm rounded-md",
                    "bg-zinc-50 border-none placeholder-zinc-400",
                    "focus:bg-zinc-100"
                  )}
                />
              </div>
            </div>

            {/* Options List */}
            <div ref={listRef} className="max-h-[280px] overflow-y-auto p-1">
              {Object.keys(groupedOptions).length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-zinc-400">
                  No results found
                </div>
              ) : (
                Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                  <div key={groupName}>
                    {/* Group Header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 bg-white">
                      {groups?.[groupName]?.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: groups[groupName].color }}
                        />
                      )}
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {groups?.[groupName]?.label || groupName}
                      </span>
                    </div>

                    {/* Group Options */}
                    {groupOptions.map((option) => {
                      const globalIndex = flatOptions.findIndex(
                        (o) => o.value === option.value
                      );
                      const isHighlighted = globalIndex === highlightedIndex;
                      const isSelected = option.value === value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                          data-highlighted={isHighlighted}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md",
                            "transition-colors",
                            isHighlighted && "bg-zinc-100",
                            isSelected && "bg-accent-50"
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color || "#6b7280" }}
                          />
                          <span
                            className={cn(
                              "flex-1 truncate",
                              isSelected ? "text-accent-700 font-medium" : "text-zinc-700"
                            )}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
