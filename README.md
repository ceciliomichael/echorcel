# Echorcel

A self-hosted deployment platform for containerized applications. Deploy your projects from Git repositories to Docker containers with automatic framework detection.

## Features

- **Multi-language support** - JavaScript, Python, Go, Rust, Ruby, PHP, Java, and more
- **Auto-detection** - Automatically detects framework from your repository
- **Real-time logs** - Stream build and runtime logs in real-time
- **One-click deploy** - Clone, build, and deploy with a single click
- **Environment variables** - Securely manage environment variables
- **Container management** - Start, stop, restart, and delete deployments

## Supported Frameworks

| Language | Frameworks |
|----------|-----------|
| JavaScript | Next.js, React, Vue, Nuxt, Svelte, Angular, Astro, Express, NestJS |
| Python | Django, FastAPI, Flask, Streamlit |
| Go | Gin, Echo, Fiber |
| Rust | Actix, Axum, Rocket |
| Ruby | Rails, Sinatra |
| PHP | Laravel, Symfony |
| Java | Spring Boot |
| Other | Static sites, Dockerfile, Docker Compose |

## Tech Stack

- **Frontend** - Next.js 14, React, Tailwind CSS
- **Backend** - Next.js API Routes
- **Database** - MongoDB
- **Containerization** - Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker
- MongoDB

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/echorcel
GITHUB_TOKEN=your_github_token (optional, for private repos)
```

## License

MIT
