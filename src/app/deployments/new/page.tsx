"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FrameworkSelect } from "@/components/ui/framework-select";
import { EnvEditor } from "@/components/ui/env-editor";
import { GitHubRepoPicker } from "@/components/ui/github-repo-picker";
import {
  FRAMEWORK_PRESETS,
  RESTART_POLICIES,
  type FrameworkPreset,
  type DeploymentFormData,
  type RestartPolicy,
} from "@/types/deployment";
import { Select } from "@/components/ui/select";
import type { DetectionResult } from "@/lib/repo-detector";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  GitBranch,
  Settings2,
  KeyRound,
  Rocket,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";

const steps = [
  { id: 1, name: "Repository", icon: GitBranch },
  { id: 2, name: "Configure", icon: Settings2 },
  { id: 3, name: "Environment", icon: KeyRound },
  { id: 4, name: "Deploy", icon: Rocket },
];

export default function NewDeploymentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState("");
  const [portTouched, setPortTouched] = useState(false);
  const [isFetchingPort, setIsFetchingPort] = useState(false);
  const [hasSuggestedName, setHasSuggestedName] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const lastStepRef = useRef(1);

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
    envVariables: [],
    port: 3100, // Will be auto-assigned when entering Step 2
    restartPolicy: "always",
  });

  // Fetch available port when entering Step 2
  useEffect(() => {
    const fetchAvailablePort = async () => {
      if (currentStep === 2 && lastStepRef.current !== 2 && !portTouched) {
        setIsFetchingPort(true);
        try {
          const res = await fetch("/api/ports/next-available");
          if (res.ok) {
            const data = await res.json();
            if (data.port) {
              setFormData((prev) => ({ ...prev, port: data.port }));
            }
          }
        } catch (_error) {
          // Keep current port if fetch fails
        } finally {
          setIsFetchingPort(false);
        }
      }
      lastStepRef.current = currentStep;
    };

    fetchAvailablePort();
  }, [currentStep, portTouched]);

  useEffect(() => {
    const suggestUniqueName = async () => {
      if (currentStep !== 2 || hasSuggestedName) {
        return;
      }

      const baseName = formData.name.trim();
      if (!baseName) {
        return;
      }

      try {
        const res = await fetch("/api/deployments");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const namesFromApi: string[] = Array.isArray(data.deployments)
          ? data.deployments
              .map((d: { name?: string }) => (typeof d.name === "string" ? d.name : ""))
              .filter((name: string) => name.length > 0)
          : [];

        setExistingNames(namesFromApi);

        let candidate = baseName;
        let counter = 1;

        while (namesFromApi.includes(candidate)) {
          candidate = `${baseName}-${counter}`;
          counter += 1;
        }

        if (candidate !== formData.name) {
          setFormData((prev) => ({ ...prev, name: candidate }));
        }
      } catch (_error) {
        return;
      } finally {
        setHasSuggestedName(true);
      }
    };

    suggestUniqueName();
  }, [currentStep, formData.name, hasSuggestedName]);

  const handleFrameworkChange = (framework: FrameworkPreset) => {
    const preset = FRAMEWORK_PRESETS[framework];
    setFormData((prev) => ({
      ...prev,
      framework,
      buildCommand: preset.buildCommand,
      outputDirectory: preset.outputDir,
      installCommand: preset.installCommand,
      startCommand: preset.startCommand,
    }));
    // Don't reset port when framework changes - keep the auto-assigned port
  };

  const updateField = <K extends keyof DeploymentFormData>(
    field: K,
    value: DeploymentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const analyzeRepo = async (url: string) => {
    if (!url.trim() || url === lastAnalyzedUrl || isAnalyzing) return;

    setLastAnalyzedUrl(url);
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gitUrl: url,
          branch: formData.branch || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalyzeError("Could not analyze. Select framework manually.");
        return;
      }

      if (data.detection) {
        setDetection(data.detection);
        const preset = data.detection.config;
        setFormData((prev) => ({
          ...prev,
          name: prev.name || data.repoName || "",
          branch: data.branch || prev.branch,
          framework: data.detection.framework,
          buildCommand: preset.buildCommand,
          outputDirectory: preset.outputDir,
          installCommand: preset.installCommand,
          startCommand: preset.startCommand,
          // Don't override port - it will be auto-assigned in Step 2
        }));
      }
    } catch (_error) {
      setAnalyzeError("Could not analyze. Select framework manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Filter out empty env variables
      const envVariables = formData.envVariables.filter((v) => v.key.trim());

      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, envVariables }),
      });

      if (res.ok) {
        const newDeployment = await res.json();
        await fetch(`/api/deployments/${newDeployment._id}/deploy`, { method: "POST" });
        router.push(`/deployments/${newDeployment._id}/deploying`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.gitUrl.trim().length > 0;
      case 2:
        return (
          formData.name.trim().length > 0 &&
          (existingNames.length === 0 || !existingNames.includes(formData.name.trim()))
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deployments
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
          New Deployment
        </h1>
        <p className="text-zinc-500 mb-8">
          Import your project and deploy it to Docker
        </p>

        {/* Progress Steps - Mobile */}
        <div className="sm:hidden mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm font-semibold text-accent-600">
                {steps[currentStep - 1].name}
              </span>
            </div>
            <div className="flex gap-1.5">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    currentStep > step.id
                      ? "bg-accent-600"
                      : currentStep === step.id
                      ? "bg-accent-400"
                      : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Steps - Desktop */}
        <div className="hidden sm:block mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-accent-600 text-white"
                          : isCurrent
                          ? "bg-accent-100 text-accent-700 border-2 border-accent-500"
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium whitespace-nowrap ${
                        isCurrent ? "text-accent-700" : "text-zinc-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.id ? "bg-accent-500" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="mb-6" padding="none">
          <CardContent className="p-5 sm:p-6">
            {/* Step 1: Repository */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                    Import Git Repository
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Select a repository or enter a URL and we&apos;ll auto-detect the framework
                  </p>
                </div>

                <div className="space-y-4">
                  <GitHubRepoPicker
                    gitUrl={formData.gitUrl}
                    branch={formData.branch}
                    rootDirectory={formData.rootDirectory}
                    onChangeUrl={(url) => {
                      updateField("gitUrl", url);
                      if (url.trim() !== lastAnalyzedUrl) {
                        setDetection(null);
                        setAnalyzeError(null);
                        setLastAnalyzedUrl("");
                      }
                      if (url.includes("github.com") && url.split("/").length >= 5) {
                        analyzeRepo(url.trim());
                      }
                    }}
                    onChangeBranch={(branch) => updateField("branch", branch)}
                    onChangeRootDir={(dir) => updateField("rootDirectory", dir)}
                    onChangeName={(name) => updateField("name", name || "")}
                  />

                  {/* Detection Status */}
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                      <span className="text-sm text-zinc-600">Detecting framework...</span>
                    </div>
                  )}

                  {detection && !isAnalyzing && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-zinc-200 shadow-sm">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: detection.config.color }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-zinc-900">{detection.config.name}</span>
                        <span className="text-zinc-400 ml-2 text-sm">detected</span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    </div>
                  )}

                  {analyzeError && !isAnalyzing && !detection && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200">
                      <AlertCircle className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-500">{analyzeError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Configure */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                    Configure Deployment
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Set up your project name and build configuration
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Name + Framework */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Project Name"
                      id="name"
                      placeholder="my-awesome-app"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      error={
                        formData.name.trim().length > 0 &&
                        existingNames.length > 0 &&
                        existingNames.includes(formData.name.trim())
                          ? "Name already exists"
                          : undefined
                      }
                    />
                    <FrameworkSelect
                      value={formData.framework}
                      onChange={handleFrameworkChange}
                      label="Framework"
                    />
                  </div>

                  {/* Row 2: Install + Build + Start (3 cols on lg) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Input
                      label="Start Command"
                      id="startCommand"
                      placeholder="npm start"
                      value={formData.startCommand}
                      onChange={(e) => updateField("startCommand", e.target.value)}
                    />
                  </div>

                  {/* Row 3: Port + Output Dir + Restart (3 cols on lg) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                      label={isFetchingPort ? "Port (checking...)" : "Port"}
                      id="port"
                      type="number"
                      min={3100}
                      max={3200}
                      value={formData.port}
                      onChange={(e) => {
                        setPortTouched(true);
                        updateField("port", parseInt(e.target.value) || 3100);
                      }}
                    />
                    <Input
                      label="Output Directory"
                      id="outputDirectory"
                      placeholder=".next"
                      value={formData.outputDirectory}
                      onChange={(e) => updateField("outputDirectory", e.target.value)}
                    />
                    <Select
                      label="Restart Policy"
                      options={RESTART_POLICIES.map((p) => ({ value: p.value, label: p.label }))}
                      value={formData.restartPolicy}
                      onChange={(e) => updateField("restartPolicy", e.target.value as RestartPolicy)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Environment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                    Environment Variables
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Add environment variables for your deployment
                  </p>
                </div>

                <EnvEditor
                  variables={formData.envVariables}
                  onChange={(vars) => updateField("envVariables", vars)}
                />

                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Tip:</strong> You can always add or modify environment
                    variables later in the deployment settings.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review & Deploy */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                    Review & Deploy
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Review your configuration before deploying
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Project Name</p>
                      <p className="font-medium text-zinc-900">{formData.name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Framework</p>
                      <p className="font-medium text-zinc-900">
                        {FRAMEWORK_PRESETS[formData.framework].name}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Branch</p>
                      <p className="font-medium text-zinc-900">{formData.branch}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Port</p>
                      <p className="font-medium text-zinc-900">{formData.port}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-1">Repository</p>
                    <p className="font-medium text-zinc-900 break-all">
                      {formData.gitUrl}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-1">Build Command</p>
                    <code className="font-mono text-sm text-accent-700">
                      {formData.buildCommand || "None"}
                    </code>
                  </div>

                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                    <p className="text-xs text-zinc-500 mb-1">
                      Environment Variables
                    </p>
                    <p className="font-medium text-zinc-900">
                      {formData.envVariables.filter((v) => v.key.trim()).length} variable(s)
                      configured
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent-50 border border-accent-200">
                  <p className="text-sm text-accent-800">
                    <strong>Ready to deploy!</strong> Your project will be cloned,
                    built, and deployed to a Docker container.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="w-full sm:w-auto">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
