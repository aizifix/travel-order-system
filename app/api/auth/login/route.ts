import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticateUser, getRoleDashboardPath } from "@/src/server/auth/service";
import {
  AUTH_SESSION_COOKIE,
  createSessionToken,
  getAuthCookieOptions,
} from "@/src/server/auth/session";

export const runtime = "nodejs";

function isJsonRequest(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

function buildLoginRedirect(request: NextRequest, message: string, email?: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  if (email) {
    url.searchParams.set("email", email);
  }
  return url;
}

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let password = "";

    if (isJsonRequest(request)) {
      const body = (await request.json()) as { email?: unknown; password?: unknown };
      email = typeof body.email === "string" ? body.email : "";
      password = typeof body.password === "string" ? body.password : "";
    } else {
      const formData = await request.formData();
      email = String(formData.get("email") ?? "");
      password = String(formData.get("password") ?? "");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      if (isJsonRequest(request)) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 },
        );
      }

      return NextResponse.redirect(
        buildLoginRedirect(request, "Email and password are required.", normalizedEmail),
        303,
      );
    }

    const result = await authenticateUser(normalizedEmail, password);

    if (!result.ok) {
      const message =
        result.reason === "inactive"
          ? "Your account is inactive."
          : "Invalid email or password.";

      if (isJsonRequest(request)) {
        return NextResponse.json({ error: message }, { status: 401 });
      }

      return NextResponse.redirect(
        buildLoginRedirect(request, message, normalizedEmail),
        303,
      );
    }

    const sessionToken = createSessionToken({
      userId: result.user.id,
      role: result.user.role,
      email: result.user.email,
      displayName: `${result.user.firstName} ${result.user.lastName}`.trim(),
    });

    const redirectPath = getRoleDashboardPath(result.user.role);

    if (isJsonRequest(request)) {
      const response = NextResponse.json({
        ok: true,
        user: result.user,
        redirectTo: redirectPath,
      });

      response.cookies.set(
        AUTH_SESSION_COOKIE,
        sessionToken,
        getAuthCookieOptions(),
      );

      return response;
    }

    const response = NextResponse.redirect(new URL(redirectPath, request.url), 303);
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      sessionToken,
      getAuthCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed", error);

    if (isJsonRequest(request)) {
      return NextResponse.json(
        { error: "Unable to log in right now. Please try again." },
        { status: 500 },
      );
    }

    const url = new URL("/login", request.url);
    url.searchParams.set("error", "Unable to log in right now. Please try again.");
    return NextResponse.redirect(url, 303);
  }
}

