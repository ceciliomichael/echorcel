import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/setup-admin"];
const AUTH_API_PREFIX = "/api/auth";
const WEBHOOK_API_PREFIX = "/api/webhooks";

function getBaseUrl(request: NextRequest): string {
  // Prefer APP_URL env var for tunnels/proxies
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  // Check forwarded headers (set by reverse proxies)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  // Fallback to host header
  const host = request.headers.get("host") || "localhost:3099";
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${protocol}://${host}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("echorcel_session")?.value;
  const hasToken = Boolean(token && token.length > 0);
  const baseUrl = getBaseUrl(request);

  // Allow Next.js static assets and images
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith("/api")) {
    // Allow auth-related API routes without session (for login/setup)
    if (pathname.startsWith(AUTH_API_PREFIX)) {
      return NextResponse.next();
    }

    // Allow webhook endpoints (they use their own secret validation)
    if (pathname.startsWith(WEBHOOK_API_PREFIX)) {
      return NextResponse.next();
    }

    // Allow GitHub integration APIs to handle their own auth/session logic
    if (pathname.startsWith("/api/github")) {
      return NextResponse.next();
    }

    // For other API routes, check cookie presence
    // Actual session validation happens in the API route handlers
    if (!hasToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Protect pages - redirect to login if no session cookie
  if (!hasToken && !isPublicPath) {
    const loginUrl = new URL("/login", baseUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (hasToken && isPublicPath) {
    const homeUrl = new URL("/", baseUrl);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
