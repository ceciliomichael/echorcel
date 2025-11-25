"use client";

import { Combobox, type ComboboxOption, type ComboboxGroup } from "./combobox";
import {
  FRAMEWORK_PRESETS,
  LANGUAGE_INFO,
  type FrameworkPreset,
  type Language,
} from "@/types/deployment";

interface FrameworkSelectProps {
  value: FrameworkPreset;
  onChange: (value: FrameworkPreset) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function FrameworkSelect({
  value,
  onChange,
  label = "Framework",
  className,
  disabled,
}: FrameworkSelectProps) {
  // Build options from presets
  const options: ComboboxOption[] = Object.values(FRAMEWORK_PRESETS).map((preset) => ({
    value: preset.id,
    label: preset.name,
    group: preset.language,
    color: preset.color,
  }));

  // Build groups from language info
  const groups: Record<string, ComboboxGroup> = Object.entries(LANGUAGE_INFO).reduce(
    (acc, [key, info]) => {
      acc[key] = {
        label: info.name,
        color: info.color,
      };
      return acc;
    },
    {} as Record<string, ComboboxGroup>
  );

  return (
    <Combobox
      options={options}
      groups={groups}
      value={value}
      onChange={(v) => onChange(v as FrameworkPreset)}
      placeholder="Select framework..."
      searchPlaceholder="Search frameworks..."
      label={label}
      className={className}
      disabled={disabled}
    />
  );
}
