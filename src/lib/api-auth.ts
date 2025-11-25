import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionByToken } from "./auth";
import type { Session } from "@/types/auth";

const SESSION_COOKIE_NAME = "echorcel_session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return getSessionByToken(token);
}

export async function requireAuth(): Promise<
  { session: Session } | { error: NextResponse }
> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session };
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
