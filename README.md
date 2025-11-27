# Echorcel

A self-hosted deployment platform for containerized applications. Deploy your projects from Git repositories to Docker containers with automatic framework detection.

## Features

- **Multi-language support** - JavaScript, Python, Go, Rust, Ruby, PHP, Java, and more
- **Auto-detection** - Automatically detects framework from your repository
- **GitHub webhooks** - Auto-deploy on push with build history and rollbacks
- **Dynamic ports** - Echorcel on port 3099, deployments on 3100-3200 (auto-assigned)
- **Real-time logs** - Stream build and runtime logs in real-time
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

```bash
MONGODB_URI=mongodb://localhost:27017/echorcel
AUTH_SECRET=your-secret-key

# Optional - only if using a reverse proxy or tunnel (Cloudflare, etc.)
# APP_URL=https://echorcel.yourdomain.com

# Optional router / domain mode for per-app subdomains
# ROUTER_DOMAIN=your-domain.com
# ECHORCEL_HOSTNAME=echorcel.your-domain.com
```

## Production Deployment

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

Echorcel UI will be available at:

- `http://localhost:3099` directly, or
- via the router on `http://localhost:4000` (local-only mode by default)

To enable domain/tunnel routing (e.g. `app1.your-domain.com`):

- Configure a tunnel / DNS to point your domain to the router
- Set `ROUTER_DOMAIN` and `ECHORCEL_HOSTNAME` in your environment

### Manual Docker Build

```bash
# Build the image
docker build -t echorcel .

# Run with MongoDB
docker run -d \
  -p 3099:3099 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e MONGODB_URI=mongodb://your-mongo:27017/echorcel \
  -e AUTH_SECRET=your-secret \
  echorcel
```

### Platform Notes

| Platform | Docker Detection |
|----------|-----------------|
| Linux | Auto-detects `/var/run/docker.sock` |
| macOS | Auto-detects `/var/run/docker.sock` |
| Windows | Auto-detects named pipe or TCP on port 2375 |

Docker configuration is **automatic** - no environment variables needed in most cases.

## License

MIT
