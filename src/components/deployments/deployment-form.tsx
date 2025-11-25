"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  FRAMEWORK_PRESETS,
  type FrameworkPreset,
  type DeploymentFormData,
} from "@/types/deployment";
import { Loader2 } from "lucide-react";

interface DeploymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeploymentFormData) => Promise<void>;
}

const frameworkOptions = Object.entries(FRAMEWORK_PRESETS).map(([key, value]) => ({
  value: key,
  label: value.name,
}));

export function DeploymentForm({ isOpen, onClose, onSubmit }: DeploymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeploymentFormData>({
    name: "",
    gitUrl: "",
    branch: "main",
    rootDirectory: "",
    framework: "nextjs",
    buildCommand: FRAMEWORK_PRESETS.nextjs.buildCommand,
    outputDirectory: FRAMEWORK_PRESETS.nextjs.outputDir,
    installCommand: FRAMEWORK_PRESETS.nextjs.installCommand,
    startCommand: FRAMEWORK_PRESETS.nextjs.startCommand,
    envVariablesRaw: "",
    port: FRAMEWORK_PRESETS.nextjs.defaultPort,
  });

  useEffect(() => {
    const preset = FRAMEWORK_PRESETS[formData.framework];
    setFormData((prev) => ({
      ...prev,
      buildCommand: preset.buildCommand,
      outputDirectory: preset.outputDir,
      installCommand: preset.installCommand,
      startCommand: preset.startCommand,
      port: preset.defaultPort,
    }));
  }, [formData.framework]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        name: "",
        gitUrl: "",
        branch: "main",
        rootDirectory: "",
        framework: "nextjs",
        buildCommand: FRAMEWORK_PRESETS.nextjs.buildCommand,
        outputDirectory: FRAMEWORK_PRESETS.nextjs.outputDir,
        installCommand: FRAMEWORK_PRESETS.nextjs.installCommand,
        startCommand: FRAMEWORK_PRESETS.nextjs.startCommand,
        envVariablesRaw: "",
        port: FRAMEWORK_PRESETS.nextjs.defaultPort,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof DeploymentFormData>(
    field: K,
    value: DeploymentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Deployment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deployment Name"
            id="name"
            placeholder="my-awesome-app"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
          <Input
            label="Port"
            id="port"
            type="number"
            min={1}
            max={65535}
            value={formData.port}
            onChange={(e) => updateField("port", parseInt(e.target.value) || 3000)}
            required
          />
        </div>

        <Input
          label="Git Repository URL"
          id="gitUrl"
          placeholder="https://github.com/user/repo"
          value={formData.gitUrl}
          onChange={(e) => updateField("gitUrl", e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Branch"
            id="branch"
            placeholder="main"
            value={formData.branch}
            onChange={(e) => updateField("branch", e.target.value)}
          />
          <Input
            label="Root Directory"
            id="rootDirectory"
            placeholder="./"
            value={formData.rootDirectory}
            onChange={(e) => updateField("rootDirectory", e.target.value)}
          />
        </div>

        <Select
          label="Framework Preset"
          id="framework"
          options={frameworkOptions}
          value={formData.framework}
          onChange={(e) => updateField("framework", e.target.value as FrameworkPreset)}
        />

        <div className="border-t border-zinc-100 pt-5">
          <h3 className="text-sm font-medium text-zinc-700 mb-4">Build Settings</h3>
          <div className="space-y-4">
            <Input
              label="Install Command"
              id="installCommand"
              placeholder="npm install"
              value={formData.installCommand}
              onChange={(e) => updateField("installCommand", e.target.value)}
            />
            <Input
              label="Build Command"
              id="buildCommand"
              placeholder="npm run build"
              value={formData.buildCommand}
              onChange={(e) => updateField("buildCommand", e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Output Directory"
                id="outputDirectory"
                placeholder=".next"
                value={formData.outputDirectory}
                onChange={(e) => updateField("outputDirectory", e.target.value)}
              />
              <Input
                label="Start Command"
                id="startCommand"
                placeholder="npm start"
                value={formData.startCommand}
                onChange={(e) => updateField("startCommand", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5">
          <Textarea
            label="Environment Variables"
            id="envVariables"
            placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
            rows={4}
            value={formData.envVariablesRaw}
            onChange={(e) => updateField("envVariablesRaw", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-zinc-500">One variable per line in KEY=value format</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Deployment"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
