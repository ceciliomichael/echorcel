import { NextRequest, NextResponse } from "next/server";
import { validateLogin, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await validateLogin(username, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      username: user.username,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
