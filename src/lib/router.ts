import http from "node:http";
import { MongoClient } from "mongodb";

const ROUTER_PORT = Number(process.env.ROUTER_PORT) || 4000;
const ECHORCEL_PORT = Number(process.env.ECHORCEL_PORT) || 3099;
const ROUTER_DOMAIN = process.env.ROUTER_DOMAIN || ""; // Optional - leave empty for local-only mode
const ECHORCEL_HOSTNAME = process.env.ECHORCEL_HOSTNAME || (ROUTER_DOMAIN ? `echorcel.${ROUTER_DOMAIN}` : "localhost");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/echorcel";

// Determine if running in tunnel/domain mode or local-only mode
const IS_TUNNEL_MODE = Boolean(ROUTER_DOMAIN);

// When running in Docker, use container name for Echorcel UI, host.docker.internal for deployed apps
const IS_DOCKER = process.env.NODE_ENV === "production" || process.env.DOCKER === "true";
const ECHORCEL_HOST = IS_DOCKER ? "echorcel" : "127.0.0.1";
const APPS_HOST = IS_DOCKER ? "host.docker.internal" : "127.0.0.1";

let mongoClient: MongoClient | null = null;

async function getDeploymentsCollection() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db().collection("deployments");
}

async function findDeploymentByHostname(hostname: string): Promise<{ port: number } | null> {
  try {
    const collection = await getDeploymentsCollection();
    const deployment = await collection.findOne({
      hostname,
      status: "running",
    });
    if (deployment) {
      return { port: deployment.port };
    }
    return null;
  } catch (_error) {
    return null;
  }
}

function proxyRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  targetPort: number,
  targetHost: string = APPS_HOST
) {
  const options: http.RequestOptions = {
    hostname: targetHost,
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${targetHost}:${targetPort}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`Proxy error to port ${targetPort}:`, err.message);
    res.writeHead(502, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>502 - Service Unavailable</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, #fafafa, #f4f4f5);
            color: #18181b;
            padding: 24px;
          }
          .container {
            text-align: center;
            max-width: 420px;
          }
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon svg {
            width: 40px;
            height: 40px;
            color: #ef4444;
          }
          .code {
            font-size: 72px;
            font-weight: 700;
            color: #18181b;
            line-height: 1;
            margin-bottom: 8px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #18181b;
            margin-bottom: 12px;
          }
          .message {
            font-size: 15px;
            color: #71717a;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: #18181b;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.15s;
          }
          .btn:hover { background: #27272a; }
          .footer {
            margin-top: 48px;
            font-size: 13px;
            color: #a1a1aa;
          }
          .footer a {
            color: #06b6d4;
            text-decoration: none;
          }
          .footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div class="code">502</div>
          <h1 class="title">Service Unavailable</h1>
          <p class="message">The application is temporarily unavailable. It may be starting up, restarting, or experiencing issues.</p>
          <a href="javascript:location.reload()" class="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Try Again
          </a>
          <div class="footer">Powered by <a href="https://${ECHORCEL_HOSTNAME}">Echorcel</a></div>
        </div>
      </body>
      </html>
    `);
  });

  req.pipe(proxyReq, { end: true });
}

function send404(res: http.ServerResponse, hostname: string) {
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not Found</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom, #fafafa, #f4f4f5);
          color: #18181b;
          padding: 24px;
        }
        .container {
          text-align: center;
          max-width: 420px;
        }
        .icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #f0fdfa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon svg {
          width: 40px;
          height: 40px;
          color: #06b6d4;
        }
        .code {
          font-size: 72px;
          font-weight: 700;
          color: #18181b;
          line-height: 1;
          margin-bottom: 8px;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #18181b;
          margin-bottom: 12px;
        }
        .message {
          font-size: 15px;
          color: #71717a;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .hostname {
          display: inline-block;
          background: #f4f4f5;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-family: ui-monospace, monospace;
          color: #52525b;
          margin-bottom: 32px;
          border: 1px solid #e4e4e7;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #18181b;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s;
        }
        .btn:hover { background: #27272a; }
        .footer {
          margin-top: 48px;
          font-size: 13px;
          color: #a1a1aa;
        }
        .footer a {
          color: #06b6d4;
          text-decoration: none;
        }
        .footer a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div class="code">404</div>
        <h1 class="title">Deployment Not Found</h1>
        <p class="message">There is no active deployment for this hostname:</p>
        <div class="hostname">${hostname}</div>
        <br>
        <a href="https://${ECHORCEL_HOSTNAME}" class="btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Go to Echorcel
        </a>
        <div class="footer">Powered by <a href="https://${ECHORCEL_HOSTNAME}">Echorcel</a></div>
      </div>
    </body>
    </html>
  `);
}

const server = http.createServer(async (req, res) => {
  const hostHeader = req.headers.host || "";
  const hostname = hostHeader.split(":")[0].toLowerCase();

  console.log(`[Router] ${req.method} ${hostname}${req.url}`);

  // Direct match for Echorcel UI (handles both tunnel and local mode)
  const isEchorcelUI = hostname === ECHORCEL_HOSTNAME.toLowerCase() ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";
  
  if (isEchorcelUI) {
    proxyRequest(req, res, ECHORCEL_PORT, ECHORCEL_HOST);
    return;
  }

  // In local-only mode (no ROUTER_DOMAIN), only serve Echorcel UI
  if (!IS_TUNNEL_MODE) {
    send404(res, hostname);
    return;
  }

  // Tunnel mode: Check if it's a subdomain of our domain
  if (!hostname.endsWith(`.${ROUTER_DOMAIN}`) && hostname !== ROUTER_DOMAIN) {
    send404(res, hostname);
    return;
  }

  // Look up deployment by hostname
  const deployment = await findDeploymentByHostname(hostname);

  if (deployment) {
    proxyRequest(req, res, deployment.port);
  } else {
    send404(res, hostname);
  }
});

server.listen(ROUTER_PORT, () => {
  console.log(`[Echorcel Router] Listening on http://localhost:${ROUTER_PORT}`);
  console.log(`[Echorcel Router] Environment: ${IS_DOCKER ? "Docker" : "Local"}`);
  
  if (IS_TUNNEL_MODE) {
    console.log(`[Echorcel Router] Mode: Tunnel/Domain (*.${ROUTER_DOMAIN})`);
    console.log(`[Echorcel Router] Echorcel UI: ${ECHORCEL_HOSTNAME} -> ${ECHORCEL_HOST}:${ECHORCEL_PORT}`);
    console.log(`[Echorcel Router] Apps: *.${ROUTER_DOMAIN} -> ${APPS_HOST}:<port>`);
  } else {
    console.log(`[Echorcel Router] Mode: Local-only (no domain configured)`);
    console.log(`[Echorcel Router] Echorcel UI: localhost:${ROUTER_PORT} -> ${ECHORCEL_HOST}:${ECHORCEL_PORT}`);
    console.log(`[Echorcel Router] Note: Set ROUTER_DOMAIN env var to enable tunnel/domain routing`);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Router] Shutting down...");
  server.close();
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});
