import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createUser } from "@/src/server/auth/service";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import type { UserRole } from "@/src/server/auth/types";

export const runtime = "nodejs";

const VALID_USER_ROLES = new Set<UserRole>(["admin", "approver", "regular"]);

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return unauthorized("Authentication required.");
  }

  if (session.role !== "admin") {
    return unauthorized("Admin access required.", 403);
  }

  let payload: Record<string, unknown>;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return badRequest("Invalid request payload.");
    }
    payload = body as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  const firstName = toTrimmedString(payload.firstName);
  const lastName = toTrimmedString(payload.lastName);
  const email = toTrimmedString(payload.email).toLowerCase();
  const password = toTrimmedString(payload.password);
  const roleValue = toTrimmedString(payload.role).toLowerCase();
  const positionName = toTrimmedString(payload.positionName);
  const divisionId = toPositiveInteger(payload.divisionId);
  const designationId = toPositiveInteger(payload.designationId);
  const employmentStatusId = toPositiveInteger(payload.employmentStatusId);
  const isActive =
    typeof payload.isActive === "boolean" ? payload.isActive : true;

  if (!firstName || !lastName || !email || !password || !roleValue || !positionName) {
    return badRequest("First name, last name, email, password, role, and position are required.");
  }

  if (!VALID_USER_ROLES.has(roleValue as UserRole)) {
    return badRequest("Invalid role.");
  }

  if (!divisionId || !designationId || !employmentStatusId) {
    return badRequest("Division, designation, and employment status are required.");
  }

  try {
    const result = await createUser({
      firstName,
      lastName,
      email,
      password,
      role: roleValue as UserRole,
      isActive,
      divisionId,
      positionName,
      designationId,
      employmentStatusId,
    });

    if (!result.ok) {
      const status =
        result.reason === "email_exists"
          ? 409
          : result.reason === "lookup_not_found"
            ? 422
            : 400;
      return NextResponse.json({ error: result.message }, { status });
    }

    return NextResponse.json(
      {
        ok: true,
        userId: result.userId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/users failed", error);
    return NextResponse.json(
      { error: "Unable to create user right now. Please try again." },
      { status: 500 },
    );
  }
}
