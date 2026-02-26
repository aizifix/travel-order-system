import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  getAuthCookieOptions,
} from "@/src/server/auth/session";

export const runtime = "nodejs";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    ...getAuthCookieOptions(0),
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  clearSessionCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  clearSessionCookie(response);
  return response;
}

