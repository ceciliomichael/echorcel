import {
  FRAMEWORK_PRESETS,
  type FrameworkPreset,
  type FrameworkConfig,
  type Language,
  type PackageManager,
} from "@/types/deployment";

export interface DetectionResult {
  framework: FrameworkPreset;
  config: FrameworkConfig;
  confidence: "high" | "medium" | "low";
  detectedFiles: string[];
  suggestedPackageManager?: PackageManager;
}

interface FileDetectionRule {
  files: string[];
  framework: FrameworkPreset;
  priority: number;
}

// Detection rules ordered by priority (higher = more specific)
const DETECTION_RULES: FileDetectionRule[] = [
  // Docker (highest priority - user wants to use their own Dockerfile)
  { files: ["docker-compose.yml", "docker-compose.yaml"], framework: "docker-compose", priority: 100 },
  { files: ["Dockerfile"], framework: "dockerfile", priority: 95 },

  // JavaScript frameworks (specific configs)
  { files: ["next.config.js"], framework: "nextjs", priority: 90 },
  { files: ["next.config.mjs"], framework: "nextjs", priority: 90 },
  { files: ["next.config.ts"], framework: "nextjs", priority: 90 },
  { files: ["nuxt.config.js"], framework: "nuxt", priority: 90 },
  { files: ["nuxt.config.ts"], framework: "nuxt", priority: 90 },
  { files: ["svelte.config.js"], framework: "svelte", priority: 90 },
  { files: ["angular.json"], framework: "angular", priority: 90 },
  { files: ["astro.config.mjs"], framework: "astro", priority: 90 },
  { files: ["astro.config.js"], framework: "astro", priority: 90 },
  { files: ["remix.config.js"], framework: "remix", priority: 90 },
  { files: ["nest-cli.json"], framework: "nestjs", priority: 90 },

  // Python frameworks
  { files: ["manage.py"], framework: "django", priority: 85 },
  { files: ["wsgi.py", "requirements.txt"], framework: "flask", priority: 80 },
  { files: ["main.py", "requirements.txt"], framework: "fastapi", priority: 75 },

  // Ruby frameworks
  { files: ["config/routes.rb", "Gemfile"], framework: "rails", priority: 85 },
  { files: ["config.ru", "Gemfile"], framework: "sinatra", priority: 75 },

  // PHP frameworks
  { files: ["artisan", "composer.json"], framework: "laravel", priority: 85 },
  { files: ["symfony.lock"], framework: "symfony", priority: 85 },

  // Java frameworks
  { files: ["pom.xml", "src/main/java"], framework: "springboot", priority: 80 },
  { files: ["build.gradle", "src/main/java"], framework: "springboot", priority: 80 },

  // Generic language detection (lower priority)
  { files: ["vite.config.js"], framework: "react", priority: 70 },
  { files: ["vite.config.ts"], framework: "react", priority: 70 },
  { files: ["package.json"], framework: "express", priority: 50 },
  { files: ["go.mod"], framework: "golang", priority: 60 },
  { files: ["Cargo.toml"], framework: "rustlang", priority: 60 },
  { files: ["Gemfile"], framework: "rubylang", priority: 50 },
  { files: ["composer.json"], framework: "phplang", priority: 50 },
  { files: ["requirements.txt"], framework: "python", priority: 40 },
  { files: ["pyproject.toml"], framework: "python", priority: 45 },
  { files: ["pom.xml"], framework: "javalang", priority: 40 },
  { files: ["build.gradle"], framework: "javalang", priority: 40 },
  { files: ["index.html"], framework: "static", priority: 10 },
];

// Package manager detection
const PACKAGE_MANAGER_FILES: Record<string, PackageManager> = {
  "yarn.lock": "yarn",
  "pnpm-lock.yaml": "pnpm",
  "bun.lockb": "bun",
  "package-lock.json": "npm",
  "poetry.lock": "poetry",
  "Pipfile.lock": "pipenv",
};

/**
 * Detect framework from a list of files in the repository
 */
export function detectFramework(files: string[]): DetectionResult | null {
  const fileSet = new Set(files.map((f) => f.toLowerCase()));
  const fileBasenames = new Set(files.map((f) => f.split("/").pop()?.toLowerCase() || ""));

  let bestMatch: { rule: FileDetectionRule; matchedFiles: string[] } | null = null;

  for (const rule of DETECTION_RULES) {
    const matchedFiles: string[] = [];

    for (const requiredFile of rule.files) {
      const normalizedRequired = requiredFile.toLowerCase();
      
      // Check if file exists (either as full path or basename)
      if (fileSet.has(normalizedRequired) || fileBasenames.has(normalizedRequired)) {
        matchedFiles.push(requiredFile);
      }
      
      // Also check if it exists in subdirectories
      for (const file of files) {
        if (file.toLowerCase().endsWith("/" + normalizedRequired) || 
            file.toLowerCase() === normalizedRequired) {
          if (!matchedFiles.includes(requiredFile)) {
            matchedFiles.push(requiredFile);
          }
        }
      }
    }

    // All required files must be present
    if (matchedFiles.length === rule.files.length) {
      if (!bestMatch || rule.priority > bestMatch.rule.priority) {
        bestMatch = { rule, matchedFiles };
      }
    }
  }

  if (!bestMatch) {
    return null;
  }

  const config = FRAMEWORK_PRESETS[bestMatch.rule.framework];
  
  // Detect package manager
  let suggestedPackageManager: PackageManager | undefined;
  for (const [file, pm] of Object.entries(PACKAGE_MANAGER_FILES)) {
    if (fileSet.has(file.toLowerCase()) || fileBasenames.has(file.toLowerCase())) {
      suggestedPackageManager = pm;
      break;
    }
  }

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (bestMatch.rule.priority >= 85) {
    confidence = "high";
  } else if (bestMatch.rule.priority >= 60) {
    confidence = "medium";
  }

  return {
    framework: bestMatch.rule.framework,
    config,
    confidence,
    detectedFiles: bestMatch.matchedFiles,
    suggestedPackageManager,
  };
}

/**
 * Get framework suggestions based on detected language
 */
export function getSuggestionsForLanguage(language: Language): FrameworkConfig[] {
  return Object.values(FRAMEWORK_PRESETS)
    .filter((preset) => preset.language === language)
    .sort((a, b) => {
      // Put generic options last
      if (a.name.includes("Generic")) return 1;
      if (b.name.includes("Generic")) return -1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Parse package.json to detect framework from dependencies
 */
export function detectFromPackageJson(packageJson: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): FrameworkPreset | null {
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for specific frameworks
  if (deps["next"]) return "nextjs";
  if (deps["nuxt"]) return "nuxt";
  if (deps["@sveltejs/kit"]) return "svelte";
  if (deps["@angular/core"]) return "angular";
  if (deps["astro"]) return "astro";
  if (deps["@remix-run/react"]) return "remix";
  if (deps["@nestjs/core"]) return "nestjs";
  if (deps["fastify"]) return "fastify";
  if (deps["express"]) return "express";
  if (deps["vue"]) return "vue";
  if (deps["react"]) return "react";

  return null;
}

/**
 * Parse requirements.txt to detect Python framework
 */
export function detectFromRequirements(content: string): FrameworkPreset | null {
  const lower = content.toLowerCase();

  if (lower.includes("django")) return "django";
  if (lower.includes("fastapi")) return "fastapi";
  if (lower.includes("flask")) return "flask";
  if (lower.includes("streamlit")) return "streamlit";

  return "python";
}

/**
 * Parse go.mod to detect Go framework
 */
export function detectFromGoMod(content: string): FrameworkPreset | null {
  const lower = content.toLowerCase();

  if (lower.includes("github.com/gin-gonic/gin")) return "gin";
  if (lower.includes("github.com/labstack/echo")) return "echo";
  if (lower.includes("github.com/gofiber/fiber")) return "fiber";

  return "golang";
}

/**
 * Parse Cargo.toml to detect Rust framework
 */
export function detectFromCargoToml(content: string): FrameworkPreset | null {
  const lower = content.toLowerCase();

  if (lower.includes("actix-web")) return "actix";
  if (lower.includes("axum")) return "axum";
  if (lower.includes("rocket")) return "rocket";

  return "rustlang";
}

/**
 * Parse Gemfile to detect Ruby framework
 */
export function detectFromGemfile(content: string): FrameworkPreset | null {
  const lower = content.toLowerCase();

  if (lower.includes("'rails'") || lower.includes('"rails"')) return "rails";
  if (lower.includes("'sinatra'") || lower.includes('"sinatra"')) return "sinatra";

  return "rubylang";
}

/**
 * Parse composer.json to detect PHP framework
 */
export function detectFromComposerJson(composerJson: {
  require?: Record<string, string>;
}): FrameworkPreset | null {
  const deps = composerJson.require || {};

  if (deps["laravel/framework"]) return "laravel";
  if (deps["symfony/framework-bundle"]) return "symfony";

  return "phplang";
}
