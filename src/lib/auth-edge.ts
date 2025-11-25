// Edge-compatible auth utilities for middleware
// Uses Web Crypto API instead of Node.js crypto

export async function hashTokenEdge(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Simple cookie presence check for middleware
// Actual session validation happens in API routes
export function hasSessionCookie(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue && cookieValue.length > 0);
}
