export type DeploymentStatus = "pending" | "cloning" | "building" | "running" | "stopped" | "failed";

// Language categories
export type Language = 
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "ruby"
  | "php"
  | "java"
  | "static"
  | "docker";

// Runtime versions
export type Runtime =
  | "node20"
  | "node18"
  | "node21"
  | "python3.12"
  | "python3.11"
  | "python3.10"
  | "go1.22"
  | "go1.21"
  | "rust1.75"
  | "ruby3.3"
  | "ruby3.2"
  | "php8.3"
  | "php8.2"
  | "java21"
  | "java17"
  | "static"
  | "docker";

// Package managers
export type PackageManager =
  | "npm"
  | "yarn"
  | "pnpm"
  | "bun"
  | "pip"
  | "poetry"
  | "pipenv"
  | "cargo"
  | "go"
  | "bundler"
  | "composer"
  | "maven"
  | "gradle"
  | "none";

export type FrameworkPreset =
  // JavaScript
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "svelte"
  | "angular"
  | "astro"
  | "remix"
  | "express"
  | "nestjs"
  | "fastify"
  // Python
  | "django"
  | "fastapi"
  | "flask"
  | "streamlit"
  | "python"
  // Go
  | "gin"
  | "echo"
  | "fiber"
  | "golang"
  // Rust
  | "actix"
  | "axum"
  | "rocket"
  | "rustlang"
  // Ruby
  | "rails"
  | "sinatra"
  | "rubylang"
  // PHP
  | "laravel"
  | "symfony"
  | "phplang"
  // Java
  | "springboot"
  | "javalang"
  // Other
  | "static"
  | "dockerfile"
  | "docker-compose";

export interface FrameworkConfig {
  id: FrameworkPreset;
  name: string;
  language: Language;
  runtime: Runtime;
  packageManager: PackageManager;
  buildCommand: string;
  outputDir: string;
  installCommand: string;
  startCommand: string;
  defaultPort: number;
  detectFiles: string[];
  color: string;
}

export const LANGUAGE_INFO: Record<Language, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "#f7df1e" },
  python: { name: "Python", color: "#3776ab" },
  go: { name: "Go", color: "#00add8" },
  rust: { name: "Rust", color: "#dea584" },
  ruby: { name: "Ruby", color: "#cc342d" },
  php: { name: "PHP", color: "#777bb4" },
  java: { name: "Java", color: "#ed8b00" },
  static: { name: "Static", color: "#6b7280" },
  docker: { name: "Docker", color: "#2496ed" },
};

export const FRAMEWORK_PRESETS: Record<FrameworkPreset, FrameworkConfig> = {
  // JavaScript Frameworks
  nextjs: {
    id: "nextjs",
    name: "Next.js",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: ".next",
    installCommand: "npm install",
    startCommand: "npm start",
    defaultPort: 3000,
    detectFiles: ["next.config.js", "next.config.mjs", "next.config.ts"],
    color: "#000000",
  },
  react: {
    id: "react",
    name: "React (Vite)",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    startCommand: "npm run preview",
    defaultPort: 4173,
    detectFiles: ["vite.config.js", "vite.config.ts"],
    color: "#61dafb",
  },
  vue: {
    id: "vue",
    name: "Vue",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    startCommand: "npm run preview",
    defaultPort: 4173,
    detectFiles: ["vue.config.js", "vite.config.ts"],
    color: "#4fc08d",
  },
  nuxt: {
    id: "nuxt",
    name: "Nuxt",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: ".output",
    installCommand: "npm install",
    startCommand: "npm run start",
    defaultPort: 3000,
    detectFiles: ["nuxt.config.js", "nuxt.config.ts"],
    color: "#00dc82",
  },
  svelte: {
    id: "svelte",
    name: "SvelteKit",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "build",
    installCommand: "npm install",
    startCommand: "npm run preview",
    defaultPort: 4173,
    detectFiles: ["svelte.config.js"],
    color: "#ff3e00",
  },
  angular: {
    id: "angular",
    name: "Angular",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    startCommand: "npm run serve",
    defaultPort: 4200,
    detectFiles: ["angular.json"],
    color: "#dd0031",
  },
  astro: {
    id: "astro",
    name: "Astro",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    startCommand: "npm run preview",
    defaultPort: 4321,
    detectFiles: ["astro.config.mjs", "astro.config.js"],
    color: "#ff5d01",
  },
  remix: {
    id: "remix",
    name: "Remix",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "build",
    installCommand: "npm install",
    startCommand: "npm start",
    defaultPort: 3000,
    detectFiles: ["remix.config.js"],
    color: "#121212",
  },
  express: {
    id: "express",
    name: "Express.js",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "",
    outputDir: "",
    installCommand: "npm install",
    startCommand: "npm start",
    defaultPort: 3000,
    detectFiles: [],
    color: "#000000",
  },
  nestjs: {
    id: "nestjs",
    name: "NestJS",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    startCommand: "npm run start:prod",
    defaultPort: 3000,
    detectFiles: ["nest-cli.json"],
    color: "#e0234e",
  },
  fastify: {
    id: "fastify",
    name: "Fastify",
    language: "javascript",
    runtime: "node20",
    packageManager: "npm",
    buildCommand: "",
    outputDir: "",
    installCommand: "npm install",
    startCommand: "npm start",
    defaultPort: 3000,
    detectFiles: [],
    color: "#000000",
  },

  // Python Frameworks
  django: {
    id: "django",
    name: "Django",
    language: "python",
    runtime: "python3.11",
    packageManager: "pip",
    buildCommand: "python manage.py collectstatic --noinput",
    outputDir: "staticfiles",
    installCommand: "pip install -r requirements.txt",
    startCommand: "gunicorn config.wsgi:application",
    defaultPort: 8000,
    detectFiles: ["manage.py", "django"],
    color: "#092e20",
  },
  fastapi: {
    id: "fastapi",
    name: "FastAPI",
    language: "python",
    runtime: "python3.11",
    packageManager: "pip",
    buildCommand: "",
    outputDir: "",
    installCommand: "pip install -r requirements.txt",
    startCommand: "uvicorn main:app --host 0.0.0.0",
    defaultPort: 8000,
    detectFiles: ["main.py"],
    color: "#009688",
  },
  flask: {
    id: "flask",
    name: "Flask",
    language: "python",
    runtime: "python3.11",
    packageManager: "pip",
    buildCommand: "",
    outputDir: "",
    installCommand: "pip install -r requirements.txt",
    startCommand: "gunicorn app:app",
    defaultPort: 5000,
    detectFiles: ["app.py", "wsgi.py"],
    color: "#000000",
  },
  streamlit: {
    id: "streamlit",
    name: "Streamlit",
    language: "python",
    runtime: "python3.11",
    packageManager: "pip",
    buildCommand: "",
    outputDir: "",
    installCommand: "pip install -r requirements.txt",
    startCommand: "streamlit run app.py --server.port $PORT",
    defaultPort: 8501,
    detectFiles: ["streamlit"],
    color: "#ff4b4b",
  },
  python: {
    id: "python",
    name: "Python (Generic)",
    language: "python",
    runtime: "python3.11",
    packageManager: "pip",
    buildCommand: "",
    outputDir: "",
    installCommand: "pip install -r requirements.txt",
    startCommand: "python main.py",
    defaultPort: 8000,
    detectFiles: ["requirements.txt", "pyproject.toml"],
    color: "#3776ab",
  },

  // Go Frameworks
  gin: {
    id: "gin",
    name: "Gin",
    language: "go",
    runtime: "go1.21",
    packageManager: "go",
    buildCommand: "go build -o app",
    outputDir: "",
    installCommand: "go mod download",
    startCommand: "./app",
    defaultPort: 8080,
    detectFiles: ["go.mod"],
    color: "#00add8",
  },
  echo: {
    id: "echo",
    name: "Echo",
    language: "go",
    runtime: "go1.21",
    packageManager: "go",
    buildCommand: "go build -o app",
    outputDir: "",
    installCommand: "go mod download",
    startCommand: "./app",
    defaultPort: 8080,
    detectFiles: ["go.mod"],
    color: "#00add8",
  },
  fiber: {
    id: "fiber",
    name: "Fiber",
    language: "go",
    runtime: "go1.21",
    packageManager: "go",
    buildCommand: "go build -o app",
    outputDir: "",
    installCommand: "go mod download",
    startCommand: "./app",
    defaultPort: 3000,
    detectFiles: ["go.mod"],
    color: "#00add8",
  },
  golang: {
    id: "golang",
    name: "Go (Generic)",
    language: "go",
    runtime: "go1.21",
    packageManager: "go",
    buildCommand: "go build -o app",
    outputDir: "",
    installCommand: "go mod download",
    startCommand: "./app",
    defaultPort: 8080,
    detectFiles: ["go.mod"],
    color: "#00add8",
  },

  // Rust Frameworks
  actix: {
    id: "actix",
    name: "Actix Web",
    language: "rust",
    runtime: "rust1.75",
    packageManager: "cargo",
    buildCommand: "cargo build --release",
    outputDir: "target/release",
    installCommand: "",
    startCommand: "./target/release/app",
    defaultPort: 8080,
    detectFiles: ["Cargo.toml"],
    color: "#dea584",
  },
  axum: {
    id: "axum",
    name: "Axum",
    language: "rust",
    runtime: "rust1.75",
    packageManager: "cargo",
    buildCommand: "cargo build --release",
    outputDir: "target/release",
    installCommand: "",
    startCommand: "./target/release/app",
    defaultPort: 3000,
    detectFiles: ["Cargo.toml"],
    color: "#dea584",
  },
  rocket: {
    id: "rocket",
    name: "Rocket",
    language: "rust",
    runtime: "rust1.75",
    packageManager: "cargo",
    buildCommand: "cargo build --release",
    outputDir: "target/release",
    installCommand: "",
    startCommand: "./target/release/app",
    defaultPort: 8000,
    detectFiles: ["Cargo.toml"],
    color: "#dea584",
  },
  rustlang: {
    id: "rustlang",
    name: "Rust (Generic)",
    language: "rust",
    runtime: "rust1.75",
    packageManager: "cargo",
    buildCommand: "cargo build --release",
    outputDir: "target/release",
    installCommand: "",
    startCommand: "./target/release/app",
    defaultPort: 8080,
    detectFiles: ["Cargo.toml"],
    color: "#dea584",
  },

  // Ruby Frameworks
  rails: {
    id: "rails",
    name: "Ruby on Rails",
    language: "ruby",
    runtime: "ruby3.2",
    packageManager: "bundler",
    buildCommand: "bundle exec rails assets:precompile",
    outputDir: "public/assets",
    installCommand: "bundle install",
    startCommand: "bundle exec rails server -b 0.0.0.0",
    defaultPort: 3000,
    detectFiles: ["Gemfile", "config/routes.rb"],
    color: "#cc342d",
  },
  sinatra: {
    id: "sinatra",
    name: "Sinatra",
    language: "ruby",
    runtime: "ruby3.2",
    packageManager: "bundler",
    buildCommand: "",
    outputDir: "",
    installCommand: "bundle install",
    startCommand: "bundle exec ruby app.rb",
    defaultPort: 4567,
    detectFiles: ["Gemfile"],
    color: "#cc342d",
  },
  rubylang: {
    id: "rubylang",
    name: "Ruby (Generic)",
    language: "ruby",
    runtime: "ruby3.2",
    packageManager: "bundler",
    buildCommand: "",
    outputDir: "",
    installCommand: "bundle install",
    startCommand: "ruby app.rb",
    defaultPort: 3000,
    detectFiles: ["Gemfile"],
    color: "#cc342d",
  },

  // PHP Frameworks
  laravel: {
    id: "laravel",
    name: "Laravel",
    language: "php",
    runtime: "php8.2",
    packageManager: "composer",
    buildCommand: "php artisan optimize",
    outputDir: "public",
    installCommand: "composer install",
    startCommand: "php artisan serve --host=0.0.0.0",
    defaultPort: 8000,
    detectFiles: ["artisan", "composer.json"],
    color: "#ff2d20",
  },
  symfony: {
    id: "symfony",
    name: "Symfony",
    language: "php",
    runtime: "php8.2",
    packageManager: "composer",
    buildCommand: "",
    outputDir: "public",
    installCommand: "composer install",
    startCommand: "symfony server:start",
    defaultPort: 8000,
    detectFiles: ["symfony.lock", "composer.json"],
    color: "#000000",
  },
  phplang: {
    id: "phplang",
    name: "PHP (Generic)",
    language: "php",
    runtime: "php8.2",
    packageManager: "composer",
    buildCommand: "",
    outputDir: "",
    installCommand: "composer install",
    startCommand: "php -S 0.0.0.0:$PORT",
    defaultPort: 8080,
    detectFiles: ["composer.json", "index.php"],
    color: "#777bb4",
  },

  // Java Frameworks
  springboot: {
    id: "springboot",
    name: "Spring Boot",
    language: "java",
    runtime: "java17",
    packageManager: "maven",
    buildCommand: "mvn package -DskipTests",
    outputDir: "target",
    installCommand: "",
    startCommand: "java -jar target/*.jar",
    defaultPort: 8080,
    detectFiles: ["pom.xml", "build.gradle"],
    color: "#6db33f",
  },
  javalang: {
    id: "javalang",
    name: "Java (Generic)",
    language: "java",
    runtime: "java17",
    packageManager: "maven",
    buildCommand: "mvn package -DskipTests",
    outputDir: "target",
    installCommand: "",
    startCommand: "java -jar target/*.jar",
    defaultPort: 8080,
    detectFiles: ["pom.xml", "build.gradle"],
    color: "#ed8b00",
  },

  // Static & Docker
  static: {
    id: "static",
    name: "Static Site",
    language: "static",
    runtime: "static",
    packageManager: "none",
    buildCommand: "",
    outputDir: ".",
    installCommand: "",
    startCommand: "",
    defaultPort: 80,
    detectFiles: ["index.html"],
    color: "#6b7280",
  },
  dockerfile: {
    id: "dockerfile",
    name: "Dockerfile",
    language: "docker",
    runtime: "docker",
    packageManager: "none",
    buildCommand: "",
    outputDir: "",
    installCommand: "",
    startCommand: "",
    defaultPort: 3000,
    detectFiles: ["Dockerfile"],
    color: "#2496ed",
  },
  "docker-compose": {
    id: "docker-compose",
    name: "Docker Compose",
    language: "docker",
    runtime: "docker",
    packageManager: "none",
    buildCommand: "",
    outputDir: "",
    installCommand: "",
    startCommand: "",
    defaultPort: 3000,
    detectFiles: ["docker-compose.yml", "docker-compose.yaml"],
    color: "#2496ed",
  },
};

// Helper to get frameworks by language
export function getFrameworksByLanguage(language: Language): FrameworkConfig[] {
  return Object.values(FRAMEWORK_PRESETS).filter(f => f.language === language);
}

// Helper to get all frameworks grouped by language
export function getFrameworksGrouped(): Record<Language, FrameworkConfig[]> {
  const grouped: Partial<Record<Language, FrameworkConfig[]>> = {};
  for (const framework of Object.values(FRAMEWORK_PRESETS)) {
    if (!grouped[framework.language]) {
      grouped[framework.language] = [];
    }
    grouped[framework.language]!.push(framework);
  }
  return grouped as Record<Language, FrameworkConfig[]>;
}

export interface EnvVariable {
  key: string;
  value: string;
}

export interface Deployment {
  _id?: string;
  name: string;
  gitUrl: string;
  branch: string;
  rootDirectory: string;
  framework: FrameworkPreset;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  startCommand: string;
  envVariables: EnvVariable[];
  port: number;
  status: DeploymentStatus;
  containerId?: string;
  imageId?: string;
  previewUrl?: string;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentFormData {
  name: string;
  gitUrl: string;
  branch: string;
  rootDirectory: string;
  framework: FrameworkPreset;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  startCommand: string;
  envVariablesRaw: string;
  port: number;
}

export interface DeploymentStats {
  total: number;
  active: number;
  building: number;
  failed: number;
}
