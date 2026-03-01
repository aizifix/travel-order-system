import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionPayload } from "@/src/server/auth/types";

export const AUTH_SESSION_COOKIE = "to_session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET (or NEXTAUTH_SECRET) is required in production.",
    );
  }

  return "dev-only-session-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  maxAgeSeconds = AUTH_SESSION_MAX_AGE_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const fullPayload: SessionPayload = { ...payload, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof parsed.userId !== "number" ||
      typeof parsed.role !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= now
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions(maxAge = AUTH_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

