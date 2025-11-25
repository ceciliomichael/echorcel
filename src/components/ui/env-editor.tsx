"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Code2,
} from "lucide-react";

interface EnvVariable {
  key: string;
  value: string;
}

interface EnvEditorProps {
  variables: EnvVariable[];
  onChange: (variables: EnvVariable[]) => void;
  readOnly?: boolean;
}

export function EnvEditor({ variables, onChange, readOnly = false }: EnvEditorProps) {
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const toggleVisibility = (index: number) => {
    const newVisible = new Set(visibleValues);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisibleValues(newVisible);
  };

  const updateVariable = (index: number, field: "key" | "value", value: string) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    onChange(newVars);
  };

  const addVariable = () => {
    onChange([...variables, { key: "", value: "" }]);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  const parseEnvString = (text: string): EnvVariable[] => {
    const lines = text
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));
    
    const newVars: EnvVariable[] = [];
    for (const line of lines) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
        newVars.push({ key, value });
      }
    }
    return newVars;
  };

  const handleImport = () => {
    const newVars = parseEnvString(importText);
    if (newVars.length > 0) {
      onChange([...variables.filter((v) => v.key), ...newVars]);
      setImportText("");
      setShowImport(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const pastedText = e.clipboardData.getData("text");
    
    // Check if pasted text contains multiple lines or KEY=VALUE format
    if (pastedText.includes("\n") || (pastedText.includes("=") && pastedText.indexOf("=") < pastedText.length - 1)) {
      const newVars = parseEnvString(pastedText);
      
      if (newVars.length > 0) {
        e.preventDefault();
        // Replace current empty row or append
        const existingVars = variables.filter((v, i) => i !== index || v.key.trim());
        onChange([...existingVars, ...newVars]);
      }
    }
  };

  const maskValue = (value: string) => {
    if (!value) return "";
    return "•".repeat(12); // Fixed length for security
  };

  // Read-only list view
  if (readOnly) {
    return (
      <div className="space-y-2">
        {variables.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">No environment variables</p>
        ) : (
          variables.map((variable, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Key Field */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="w-full h-10 pl-10 pr-3 flex items-center font-mono text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 truncate">
                  {variable.key}
                </div>
              </div>

              {/* Value Field */}
              <div className="flex-1 relative">
                <div className="w-full h-10 px-3 pr-10 flex items-center font-mono text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-500 truncate cursor-pointer hover:border-zinc-300">
                  {visibleValues.has(index) ? variable.value : "••••••••••••••••••••"}
                </div>
                <button
                  type="button"
                  onClick={() => toggleVisibility(index)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {visibleValues.has(index) ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Editable view
  return (
    <div className="space-y-4">
      {/* Variable List */}
      <div className="space-y-2">
        {variables.map((variable, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Key Field */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Code2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="KEY"
                value={variable.key}
                onChange={(e) => updateVariable(index, "key", e.target.value)}
                onPaste={(e) => handlePaste(e, index)}
                className="w-full h-10 pl-10 pr-3 font-mono text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            
            {/* Value Field */}
            <div className="flex-1 relative">
              {visibleValues.has(index) ? (
                <input
                  type="text"
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(index, "value", e.target.value)}
                  className="w-full h-10 px-3 pr-10 font-mono text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-colors"
                />
              ) : (
                <div
                  onClick={() => toggleVisibility(index)}
                  className="flex items-center h-10 px-3 pr-10 border border-zinc-200 rounded-lg bg-white cursor-pointer hover:border-zinc-300"
                >
                  <span className="font-mono text-sm text-zinc-500">
                    {variable.value ? "••••••••••••" : ""}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleVisibility(index)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {visibleValues.has(index) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => removeVariable(index)}
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Another Button */}
      <button
        type="button"
        onClick={addVariable}
        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Another
      </button>

      {/* Import Section */}
      <div className="pt-4 border-t border-zinc-200">
        {showImport ? (
          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your .env contents here&#10;KEY=value&#10;ANOTHER_KEY=another_value"
              rows={5}
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImport}>
                Import
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowImport(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Import .env
            </button>
            <span className="text-sm text-zinc-400">or paste the .env contents above</span>
          </div>
        )}
      </div>
    </div>
  );
}
