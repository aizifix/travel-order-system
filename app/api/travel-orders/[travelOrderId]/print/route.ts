import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "@/src/server/auth/session";
import { generateTravelOrderPdf } from "@/src/server/travel-orders/pdf-generator";
import { getPrintableTravelOrderForViewer } from "@/src/server/travel-orders/print-service";

export const runtime = "nodejs";

type RouteContext = Readonly<{
  params: Promise<{
    travelOrderId: string;
  }>;
}>;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

async function handlePrintRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    return jsonError("Authentication required.", 401);
  }

  if (
    session.role !== "regular" &&
    session.role !== "approver" &&
    session.role !== "admin"
  ) {
    return jsonError("User role is not allowed to print travel orders.", 403);
  }

  const { travelOrderId: rawTravelOrderId } = await context.params;
  const travelOrderId = Number.parseInt(rawTravelOrderId, 10);

  if (!Number.isInteger(travelOrderId) || travelOrderId < 1) {
    return jsonError("Invalid travel-order reference.", 400);
  }

  try {
    const orderResult = await getPrintableTravelOrderForViewer(
      { userId: session.userId, role: session.role },
      travelOrderId,
    );

    if (!orderResult.ok) {
      return jsonError(orderResult.message, orderResult.status);
    }

    const { pdfBuffer, fileName } = await generateTravelOrderPdf(orderResult.data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Travel order print generation failed", error);
    return jsonError("Unable to generate printable PDF right now.", 500);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return handlePrintRequest(request, context);
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return handlePrintRequest(request, context);
}
