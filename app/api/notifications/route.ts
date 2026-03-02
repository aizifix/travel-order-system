import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "@/src/server/notifications/service";

export const runtime = "nodejs";

function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

function toPositiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toNonNegativeInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const limit = toPositiveInteger(request.nextUrl.searchParams.get("limit"));
  const offset = toNonNegativeInteger(request.nextUrl.searchParams.get("offset"));
  const unreadOnlyRaw = request.nextUrl.searchParams.get("unreadOnly");
  const unreadOnly = unreadOnlyRaw === "1" || unreadOnlyRaw === "true";

  try {
    const result = await getNotifications(session.userId, {
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    return NextResponse.json(
      { error: "Unable to load notifications right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { notificationId?: unknown; markAll?: unknown };
  try {
    body = (await request.json()) as { notificationId?: unknown; markAll?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    if (body.markAll === true) {
      const result = await markAllRead(session.userId);
      return NextResponse.json({
        ok: true,
        changedCount: result.changedCount,
        unreadCount: result.unreadCount,
      });
    }

    const notificationId =
      typeof body.notificationId === "number" && Number.isInteger(body.notificationId)
        ? body.notificationId
        : typeof body.notificationId === "string" && /^\d+$/.test(body.notificationId)
          ? Number.parseInt(body.notificationId, 10)
          : null;

    if (!notificationId || notificationId < 1) {
      return NextResponse.json(
        {
          error:
            "Provide either { markAll: true } or { notificationId: <positive integer> }.",
        },
        { status: 400 },
      );
    }

    const result = await markRead(notificationId, session.userId);
    return NextResponse.json({
      ok: true,
      changed: result.changed,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error("PATCH /api/notifications failed", error);
    return NextResponse.json(
      { error: "Unable to update notifications right now." },
      { status: 500 },
    );
  }
}
