import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import {
  createRegularTravelOrder,
  getTravelOrderTrips,
} from "@/src/server/travel-orders/service";
import {
  jsonError,
  parseCreateInput,
  parseJsonBody,
  statusFromMutationMessage,
} from "./_lib/request-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  if (session.role !== "regular") {
    return jsonError("Regular user access required.", 403);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsedInput = parseCreateInput(parsedBody.data);
  if (!parsedInput.ok) {
    return jsonError(parsedInput.message, 400);
  }

  try {
    const result = await createRegularTravelOrder(session.userId, parsedInput.data);

    if (!result.ok) {
      return jsonError(
        result.message,
        statusFromMutationMessage(result.message),
      );
    }

    const trips = await getTravelOrderTrips(result.travelOrderId);

    return NextResponse.json(
      {
        ok: true,
        travelOrderId: result.travelOrderId,
        orderNo: result.orderNo,
        statusLabel: result.statusLabel,
        trips,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/travel-orders failed", error);
    return jsonError("Unable to create travel order right now.", 500);
  }
}
