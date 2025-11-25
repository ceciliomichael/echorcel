"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Deployment } from "@/types/deployment";
import {
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Globe,
  GitBranch,
  Settings,
} from "lucide-react";
import confetti from "canvas-confetti";

interface DeploymentSuccessProps {
  deployment: Deployment;
  onContinue: () => void;
}

export function DeploymentSuccess({ deployment, onContinue }: DeploymentSuccessProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const previewUrl = `http://localhost:${deployment.port}`;

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#7c3aed", "#a78bfa", "#c4b5fd"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#7c3aed", "#a78bfa", "#c4b5fd"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const nextSteps = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Visit your site",
      description: "Your deployment is live and ready to view",
      action: () => window.open(previewUrl, "_blank"),
      hasArrow: true,
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Configure Settings",
      description: "Customize environment variables and build settings",
      action: onContinue,
      hasArrow: true,
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: "Push Changes",
      description: "Redeploy by pushing changes to your repository",
      hasArrow: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-accent-50 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-200/30 via-accent-200/20 to-transparent blur-3xl" />
      
      <div className="relative w-full max-w-2xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Congratulations!
          </h1>
          <p className="text-zinc-600">
            You just deployed <span className="font-semibold text-zinc-900">{deployment.name}</span> successfully.
          </p>
        </div>

        {/* Preview Frame - Desktop Scaled */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-200 via-accent-200 to-violet-200 rounded-xl blur opacity-50" />
          <div className="relative bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-zinc-200 text-sm">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-600 truncate">{previewUrl}</span>
                </div>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            {/* iframe Preview - Scaled Desktop View (Non-interactive thumbnail) */}
            <div className="relative h-[300px] bg-zinc-100 overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="animate-pulse text-zinc-400">Loading preview...</div>
                </div>
              )}
              <div className="absolute inset-0 origin-top-left pointer-events-none" style={{ width: "1440px", height: "900px", transform: "scale(0.42)" }}>
                <iframe
                  src={previewUrl}
                  className={`w-full h-full border-0 transition-opacity duration-300 ${iframeLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setIframeLoaded(true)}
                  title="Deployment Preview"
                  tabIndex={-1}
                />
              </div>
              {/* Overlay to prevent interaction */}
              <div className="absolute inset-0 z-20" />
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 mb-4">Next Steps</h2>
          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <button
                key={index}
                onClick={step.action}
                disabled={!step.action}
                className="w-full flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-left disabled:cursor-default disabled:hover:bg-white disabled:hover:border-zinc-200"
              >
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{step.title}</p>
                  <p className="text-sm text-zinc-500">{step.description}</p>
                </div>
                {step.hasArrow && (
                  <ArrowRight className="w-5 h-5 text-zinc-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button onClick={onContinue} className="w-full" size="lg">
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}
