import { NextRequest, NextResponse } from "next/server";
import { createAdmin, createSession, setSessionCookie, hasAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const adminExists = await hasAdmin();
    if (adminExists) {
      return NextResponse.json(
        { error: "Admin already exists" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { username, password, confirmPassword } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const user = await createAdmin(username, password);
    const token = await createSession(user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
