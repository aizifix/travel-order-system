import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import {
  getTravelOrderTrips,
  updateRegularTravelOrder,
} from "@/src/server/travel-orders/service";
import {
  jsonError,
  parseJsonBody,
  parseTravelOrderId,
  parseUpdateInput,
  statusFromMutationMessage,
} from "../_lib/request-utils";

export const runtime = "nodejs";

type RouteContext = Readonly<{
  params: Promise<{
    travelOrderId: string;
  }>;
}>;

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  if (session.role !== "regular") {
    return jsonError("Regular user access required.", 403);
  }

  const { travelOrderId: rawTravelOrderId } = await context.params;
  const travelOrderId = parseTravelOrderId(rawTravelOrderId);

  if (!travelOrderId) {
    return jsonError("Invalid travel-order reference.", 400);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsedInput = parseUpdateInput(parsedBody.data);
  if (!parsedInput.ok) {
    return jsonError(parsedInput.message, 400);
  }

  try {
    const result = await updateRegularTravelOrder(
      session.userId,
      travelOrderId,
      parsedInput.data,
    );

    if (!result.ok) {
      return jsonError(
        result.message,
        statusFromMutationMessage(result.message),
      );
    }

    const trips = await getTravelOrderTrips(travelOrderId);

    return NextResponse.json({
      ok: true,
      travelOrderId: result.travelOrderId,
      orderNo: result.orderNo,
      trips,
    });
  } catch (error) {
    console.error(`PUT /api/travel-orders/${travelOrderId} failed`, error);
    return jsonError("Unable to update the travel order right now.", 500);
  }
}
