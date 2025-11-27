"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "./input";
import {
  Github,
  Search,
  Loader2,
  Lock,
  Globe,
  GitBranch,
  Link as LinkIcon,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  cloneUrl: string;
  defaultBranch: string;
  updatedAt: string;
  language: string | null;
  description: string | null;
}

interface Branch {
  name: string;
  protected: boolean;
}

type SourceType = "github" | "url";

interface GitHubRepoPickerProps {
  gitUrl: string;
  branch: string;
  rootDirectory: string;
  onChangeUrl: (url: string) => void;
  onChangeBranch: (branch: string) => void;
  onChangeRootDir: (dir: string) => void;
  onChangeName: (name: string) => void;
}

export function GitHubRepoPicker({
  gitUrl,
  branch,
  rootDirectory,
  onChangeUrl,
  onChangeBranch,
  onChangeRootDir,
  onChangeName,
}: GitHubRepoPickerProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("github");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [initializedFromGitUrl, setInitializedFromGitUrl] = useState(false);

  // Check GitHub connection and restore state from gitUrl
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/github/status");
        const data = await res.json();
        setIsConnected(data.connected);
        if (data.connected) {
          setUsername(data.username);
        } else {
          setSourceType("url");
          // If not connected and we have a gitUrl, it must be custom
          if (gitUrl && !initializedFromGitUrl) {
            setCustomUrl(gitUrl);
            setInitializedFromGitUrl(true);
          }
        }
      } catch {
        setIsConnected(false);
        setSourceType("url");
      }
    };
    checkConnection();
  }, [gitUrl, initializedFromGitUrl]);

  // Fetch repos when connected
  const fetchRepos = useCallback(async (query?: string) => {
    setIsLoading(true);
    try {
      const url = query ? `/api/github/repos?q=${encodeURIComponent(query)}` : "/api/github/repos";
      const res = await fetch(url);
      const data = await res.json();
      setRepos(data.repos || []);
    } catch {
      console.error("Failed to fetch repos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch branches for selected repo
  const fetchBranches = useCallback(async (fullName: string) => {
    setIsLoadingBranches(true);
    setBranches([]);
    try {
      const [owner, repo] = fullName.split("/");
      const res = await fetch(`/api/github/repos/${owner}/${repo}/branches`);
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {
      console.error("Failed to fetch branches");
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && sourceType === "github") {
      fetchRepos();
    }
  }, [isConnected, sourceType, fetchRepos]);

  // Debounced search
  useEffect(() => {
    if (!isConnected || sourceType !== "github") return;
    const timer = setTimeout(() => fetchRepos(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isConnected, sourceType, fetchRepos]);

  // Restore selected repo from gitUrl when repos are loaded
  useEffect(() => {
    if (repos.length > 0 && gitUrl && isConnected && !selectedRepo) {
      // Check if gitUrl matches any repo's clone URL
      const matchingRepo = repos.find(r => r.cloneUrl === gitUrl);
      if (matchingRepo) {
        setSelectedRepo(matchingRepo);
        setSourceType("github");
        fetchBranches(matchingRepo.fullName);
        setInitializedFromGitUrl(true);
      }
    }
  }, [repos, gitUrl, isConnected, selectedRepo, fetchBranches]);

  // If gitUrl looks like a custom URL and no repo is selected, switch to URL mode
  useEffect(() => {
    if (!initializedFromGitUrl && gitUrl && isConnected === true && repos.length > 0) {
      const matchingRepo = repos.find(r => r.cloneUrl === gitUrl);
      if (!matchingRepo && (gitUrl.startsWith("https://") || gitUrl.startsWith("git@"))) {
        setSourceType("url");
        setCustomUrl(gitUrl);
        setInitializedFromGitUrl(true);
      }
    }
  }, [gitUrl, repos, isConnected, initializedFromGitUrl]);

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    onChangeUrl(repo.cloneUrl);
    onChangeBranch(repo.defaultBranch);
    onChangeName(repo.name);
    fetchBranches(repo.fullName);
    setShowRepoDropdown(false);
  };

  // When switching to URL mode, use the custom URL (not the GitHub-selected one)
  const handleSwitchToUrl = () => {
    setSourceType("url");
    // Restore custom URL when switching back
    onChangeUrl(customUrl);
  };

  // When switching to GitHub mode, restore the selected repo URL if any
  const handleSwitchToGitHub = () => {
    if (isConnected) {
      setSourceType("github");
      if (selectedRepo) {
        onChangeUrl(selectedRepo.cloneUrl);
      }
    }
  };

  const handleSelectBranch = (branchName: string) => {
    onChangeBranch(branchName);
    setShowBranchDropdown(false);
  };

  const formatTimeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  // Loading state
  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2 p-4 bg-zinc-50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        <span className="text-sm text-zinc-500">Checking GitHub connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Source Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">Import from</label>
        
        {/* Mobile: Dropdown */}
        <div className="sm:hidden relative">
          <button
            type="button"
            onClick={() => setShowSourceDropdown(!showSourceDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] bg-white border border-zinc-200 rounded-xl text-left shadow-soft"
          >
            <div className="flex items-center gap-3">
              {sourceType === "github" ? (
                <>
                  <Github className="w-5 h-5 text-zinc-700" />
                  <span className="font-medium text-zinc-900">GitHub</span>
                  {isConnected && <span className="text-xs text-zinc-400">@{username}</span>}
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 text-zinc-700" />
                  <span className="font-medium text-zinc-900">Custom URL</span>
                </>
              )}
            </div>
            <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${showSourceDropdown ? "rotate-180" : ""}`} />
          </button>

          {showSourceDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSourceDropdown(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchToGitHub();
                    setShowSourceDropdown(false);
                  }}
                  disabled={!isConnected}
                  className={`w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left transition-colors ${
                    sourceType === "github" ? "bg-accent-50 text-accent-700" : "text-zinc-700 hover:bg-zinc-50"
                  } ${!isConnected ? "opacity-50" : ""}`}
                >
                  <Github className="w-5 h-5" />
                  <span className="flex-1 font-medium">GitHub</span>
                  {isConnected && <span className="text-xs text-zinc-400">@{username}</span>}
                  {sourceType === "github" && <Check className="w-5 h-5 text-accent-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSwitchToUrl();
                    setShowSourceDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left transition-colors ${
                    sourceType === "url" ? "bg-accent-50 text-accent-700" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="flex-1 font-medium">Custom URL</span>
                  {sourceType === "url" && <Check className="w-5 h-5 text-accent-600" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop: Toggle buttons */}
        <div className="hidden sm:flex rounded-lg border border-zinc-200 p-1 bg-zinc-50">
          <button
            type="button"
            onClick={handleSwitchToGitHub}
            disabled={!isConnected}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sourceType === "github"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Github className="w-4 h-4" />
            GitHub
            {isConnected && <span className="text-xs text-zinc-400">@{username}</span>}
          </button>
          <button
            type="button"
            onClick={handleSwitchToUrl}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sourceType === "url"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Custom URL
          </button>
        </div>
        {!isConnected && (
          <p className="mt-2 text-xs text-zinc-500">
            <Link href="/settings?tab=integrations" className="text-accent-600 hover:underline">
              Connect GitHub
            </Link>{" "}
            to import from your repositories
          </p>
        )}
      </div>

      {/* GitHub Repo Picker */}
      {sourceType === "github" && isConnected && (
        <>
          {/* Repo Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Repository</label>
            <button
              type="button"
              onClick={() => setShowRepoDropdown(!showRepoDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left"
            >
              {selectedRepo ? (
                <span className="flex items-center gap-2">
                  {selectedRepo.private ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Globe className="w-3.5 h-3.5 text-zinc-400" />}
                  <span className="font-medium text-zinc-900">{selectedRepo.fullName}</span>
                </span>
              ) : (
                <span className="text-zinc-500">Select a repository</span>
              )}
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>

            {showRepoDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-lg border border-zinc-200 shadow-lg">
                <div className="p-2 border-b border-zinc-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-zinc-200 focus:border-accent-500 outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                    </div>
                  ) : repos.length === 0 ? (
                    <div className="text-center py-8 text-sm text-zinc-500">No repositories found</div>
                  ) : (
                    repos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => handleSelectRepo(repo)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 text-left"
                      >
                        {repo.private ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Globe className="w-3.5 h-3.5 text-zinc-400" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-900 truncate">{repo.name}</div>
                          <div className="text-xs text-zinc-500 flex items-center gap-2">
                            {repo.language && <span>{repo.language}</span>}
                            <span>{formatTimeAgo(repo.updatedAt)}</span>
                          </div>
                        </div>
                        {selectedRepo?.id === repo.id && <Check className="w-4 h-4 text-accent-600" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Branch & Root Directory - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Branch</label>
              <button
                type="button"
                onClick={() => selectedRepo && setShowBranchDropdown(!showBranchDropdown)}
                disabled={!selectedRepo}
                className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-sm rounded-lg border border-zinc-200 bg-white transition-colors text-left ${
                  selectedRepo ? "hover:bg-zinc-50" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-zinc-500" />
                  <span className={branch ? "text-zinc-900" : "text-zinc-500"}>
                    {branch || "Select branch"}
                  </span>
                </span>
                {isLoadingBranches ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {showBranchDropdown && branches.length > 0 && (
                <div className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto bg-white rounded-lg border border-zinc-200 shadow-lg">
                  {branches.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleSelectBranch(b.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      <span className="flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                        {b.name}
                        {b.protected && <Lock className="w-3 h-3 text-amber-500" />}
                      </span>
                      {branch === b.name && <Check className="w-4 h-4 text-accent-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Root Directory"
              placeholder="./"
              value={rootDirectory}
              onChange={(e) => onChangeRootDir(e.target.value)}
              hint="Leave empty for root"
            />
          </div>
        </>
      )}

      {/* Custom URL Input */}
      {sourceType === "url" && (
        <>
          <Input
            label="Git Repository URL"
            placeholder="https://github.com/user/repo"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              onChangeUrl(e.target.value);
            }}
            hint="HTTPS or SSH URL to any Git repository"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch"
              placeholder="main"
              value={branch}
              onChange={(e) => onChangeBranch(e.target.value)}
              hint="Default branch to deploy"
            />
            <Input
              label="Root Directory"
              placeholder="./"
              value={rootDirectory}
              onChange={(e) => onChangeRootDir(e.target.value)}
              hint="Leave empty for root"
            />
          </div>
        </>
      )}
    </div>
  );
}
