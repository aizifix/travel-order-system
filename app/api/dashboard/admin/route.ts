import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAdminDashboardStats } from "@/src/server/dashboard/admin";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";

export const runtime = "nodejs";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return unauthorized("Authentication required.");
  }

  if (session.role !== "admin") {
    return unauthorized("Admin access required.", 403);
  }

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json({
      stats,
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        displayName: session.displayName,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/admin failed", error);
    return NextResponse.json(
      { error: "Unable to load admin dashboard data." },
      { status: 500 },
    );
  }
}

