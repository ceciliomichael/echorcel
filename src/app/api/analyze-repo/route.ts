import { NextResponse } from "next/server";
import {
  detectFramework,
  detectFromPackageJson,
  detectFromRequirements,
  detectFromGoMod,
  detectFromCargoToml,
  detectFromGemfile,
  detectFromComposerJson,
  type DetectionResult,
} from "@/lib/repo-detector";
import { FRAMEWORK_PRESETS } from "@/types/deployment";

interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
}

interface GitHubRepo {
  default_branch: string;
  name: string;
}

function parseGitUrl(gitUrl: string): { owner: string; repo: string } | null {
  // Handle various git URL formats
  const patterns = [
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/,
    /^([\w.-]+)\/([\w.-]+)$/,
  ];

  for (const pattern of patterns) {
    const match = gitUrl.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

async function fetchGitHubApi(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Echorcel-Deployment",
  };

  // Add GitHub token if available
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return fetch(url, { headers });
}

async function getRepoFiles(owner: string, repo: string, branch: string, path = ""): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetchGitHubApi(url);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const contents: GitHubContent[] = await response.json();
  const files: string[] = [];

  for (const item of contents) {
    if (item.type === "file") {
      files.push(item.path);
    } else if (item.type === "dir" && !item.name.startsWith(".") && item.name !== "node_modules") {
      // Only recurse into first level of important directories
      if (["src", "config", "app", "lib"].includes(item.name)) {
        const subFiles = await getRepoFiles(owner, repo, branch, item.path);
        files.push(...subFiles);
      }
    }
  }

  return files;
}

async function getFileContent(owner: string, repo: string, branch: string, path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.text();
}

export async function POST(request: Request) {
  try {
    const { gitUrl, branch: requestedBranch } = await request.json();

    if (!gitUrl) {
      return NextResponse.json({ error: "Git URL is required" }, { status: 400 });
    }

    // Parse GitHub URL
    const parsed = parseGitUrl(gitUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid Git URL. Currently only GitHub repositories are supported for auto-detection." },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Get repo info for default branch
    const repoResponse = await fetchGitHubApi(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return NextResponse.json(
          { error: "Repository not found. Make sure it exists and is public." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch repository info" },
        { status: repoResponse.status }
      );
    }

    const repoInfo: GitHubRepo = await repoResponse.json();
    const branch = requestedBranch || repoInfo.default_branch;

    // Get files in the repo
    const files = await getRepoFiles(owner, repo, branch);

    // Basic file-based detection
    let detection = detectFramework(files);

    // Enhanced detection by reading specific files
    if (files.includes("package.json")) {
      const content = await getFileContent(owner, repo, branch, "package.json");
      if (content) {
        try {
          const packageJson = JSON.parse(content);
          const detected = detectFromPackageJson(packageJson);
          if (detected) {
            detection = {
              framework: detected,
              config: FRAMEWORK_PRESETS[detected],
              confidence: "high",
              detectedFiles: ["package.json"],
              suggestedPackageManager: detection?.suggestedPackageManager,
            };
          }
        } catch (_e) {
          // Invalid JSON, continue with file-based detection
        }
      }
    }

    if (files.includes("requirements.txt") && (!detection || detection.config.language !== "python")) {
      const content = await getFileContent(owner, repo, branch, "requirements.txt");
      if (content) {
        const detected = detectFromRequirements(content);
        if (detected) {
          detection = {
            framework: detected,
            config: FRAMEWORK_PRESETS[detected],
            confidence: detected === "python" ? "medium" : "high",
            detectedFiles: ["requirements.txt"],
          };
        }
      }
    }

    if (files.includes("go.mod") && (!detection || detection.config.language !== "go")) {
      const content = await getFileContent(owner, repo, branch, "go.mod");
      if (content) {
        const detected = detectFromGoMod(content);
        if (detected) {
          detection = {
            framework: detected,
            config: FRAMEWORK_PRESETS[detected],
            confidence: detected === "golang" ? "medium" : "high",
            detectedFiles: ["go.mod"],
          };
        }
      }
    }

    if (files.includes("Cargo.toml") && (!detection || detection.config.language !== "rust")) {
      const content = await getFileContent(owner, repo, branch, "Cargo.toml");
      if (content) {
        const detected = detectFromCargoToml(content);
        if (detected) {
          detection = {
            framework: detected,
            config: FRAMEWORK_PRESETS[detected],
            confidence: detected === "rustlang" ? "medium" : "high",
            detectedFiles: ["Cargo.toml"],
          };
        }
      }
    }

    if (files.includes("Gemfile") && (!detection || detection.config.language !== "ruby")) {
      const content = await getFileContent(owner, repo, branch, "Gemfile");
      if (content) {
        const detected = detectFromGemfile(content);
        if (detected) {
          detection = {
            framework: detected,
            config: FRAMEWORK_PRESETS[detected],
            confidence: detected === "rubylang" ? "medium" : "high",
            detectedFiles: ["Gemfile"],
          };
        }
      }
    }

    if (files.includes("composer.json") && (!detection || detection.config.language !== "php")) {
      const content = await getFileContent(owner, repo, branch, "composer.json");
      if (content) {
        try {
          const composerJson = JSON.parse(content);
          const detected = detectFromComposerJson(composerJson);
          if (detected) {
            detection = {
              framework: detected,
              config: FRAMEWORK_PRESETS[detected],
              confidence: detected === "phplang" ? "medium" : "high",
              detectedFiles: ["composer.json"],
            };
          }
        } catch (_e) {
          // Invalid JSON
        }
      }
    }

    return NextResponse.json({
      success: true,
      repoName: repoInfo.name,
      branch,
      detection,
      files: files.slice(0, 50), // Return first 50 files for reference
    });
  } catch (error) {
    console.error("Analyze repo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze repository" },
      { status: 500 }
    );
  }
}
