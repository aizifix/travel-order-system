import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getPtrSummaryForAdmin,
  getDivisionsForFilter,
  type PtrSummaryFilter,
} from "@/src/server/ptr-summary/service";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";

export const runtime = "nodejs";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

function parseFilterFromRequest(request: NextRequest): PtrSummaryFilter {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const divisionId = searchParams.get("divisionId");
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  return {
    search,
    status,
    divisionId: divisionId ? parseInt(divisionId, 10) : undefined,
    startDate,
    endDate,
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  };
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
    const [filter, divisions] = await Promise.all([
      Promise.resolve(parseFilterFromRequest(request)),
      getDivisionsForFilter(),
    ]);

    const result = await getPtrSummaryForAdmin(filter);

    return NextResponse.json({
      items: result.items,
      pagination: result.pagination,
      divisions,
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        displayName: session.displayName,
      },
    });
  } catch (error) {
    console.error("GET /api/ptr-summary/admin failed", error);
    return NextResponse.json(
      { error: "Unable to load PTR summary data." },
      { status: 500 }
    );
  }
}
