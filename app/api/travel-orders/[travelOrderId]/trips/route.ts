import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import { getTravelOrderTrips } from "@/src/server/travel-orders/service";
import {
  assertTravelOrderReadable,
  jsonError,
  parseTravelOrderId,
} from "../../_lib/request-utils";

export const runtime = "nodejs";

type RouteContext = Readonly<{
  params: Promise<{
    travelOrderId: string;
  }>;
}>;

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  const { travelOrderId: rawTravelOrderId } = await context.params;
  const travelOrderId = parseTravelOrderId(rawTravelOrderId);

  if (!travelOrderId) {
    return jsonError("Invalid travel-order reference.", 400);
  }

  try {
    const accessCheck = await assertTravelOrderReadable(session, travelOrderId);
    if (!accessCheck.ok) {
      return jsonError(accessCheck.message, accessCheck.status);
    }

    const trips = await getTravelOrderTrips(travelOrderId);

    return NextResponse.json(
      { trips },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      `GET /api/travel-orders/${travelOrderId}/trips failed`,
      error,
    );
    return jsonError("Unable to load travel-order trips right now.", 500);
  }
}
