import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import type { SessionPayload } from "@/src/server/auth/types";
import { getDbPool } from "@/src/server/db/mysql";
import type {
  CreateRegularTravelOrderInput,
  TravelOrderTripInput,
  UpdateRegularTravelOrderInput,
} from "@/src/server/travel-orders/service";

type JsonObject = Record<string, unknown>;

type TravelOrderAccessRow = RowDataPacket & {
  requester_user_id: number;
  recommending_approver_id: number | null;
};

type ParseResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; message: string }>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
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

function toNullableInteger(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return toPositiveInteger(value);
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "on") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "off") {
      return false;
    }
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return fallback;
}

function parseTrips(
  value: unknown,
): readonly TravelOrderTripInput[] | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: TravelOrderTripInput[] = [];

  for (const entry of value) {
    if (!isJsonObject(entry)) {
      return null;
    }

    parsed.push({
      specificDestination: toTrimmedString(entry.specificDestination),
      specificPurpose: toTrimmedString(entry.specificPurpose),
      departureDate: toTrimmedString(entry.departureDate),
      returnDate: toTrimmedString(entry.returnDate),
    });
  }

  return parsed;
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function parseTravelOrderId(rawTravelOrderId: string): number | null {
  const travelOrderId = Number.parseInt(rawTravelOrderId, 10);
  return Number.isInteger(travelOrderId) && travelOrderId > 0
    ? travelOrderId
    : null;
}

export async function parseJsonBody(
  request: NextRequest,
): Promise<
  | Readonly<{ ok: true; data: JsonObject }>
  | Readonly<{ ok: false; response: NextResponse }>
> {
  try {
    const body = await request.json();
    if (!isJsonObject(body)) {
      return {
        ok: false,
        response: jsonError("Invalid request payload.", 400),
      };
    }

    return {
      ok: true,
      data: body,
    };
  } catch {
    return {
      ok: false,
      response: jsonError("Invalid JSON payload.", 400),
    };
  }
}

export function parseCreateInput(
  payload: JsonObject,
): ParseResult<CreateRegularTravelOrderInput> {
  const trips = parseTrips(payload.trips);
  if (trips === null) {
    return {
      ok: false,
      message: "Field `trips` must be an array of trip objects.",
    };
  }

  return {
    ok: true,
    data: {
      travelTypeId: toNullableInteger(payload.travelTypeId),
      transportationId: toNullableInteger(payload.transportationId),
      programId: toNullableInteger(payload.programId),
      specificDestination: toTrimmedString(payload.specificDestination),
      specificPurpose: toTrimmedString(payload.specificPurpose),
      fundingSource: toTrimmedString(payload.fundingSource),
      remarks: toTrimmedString(payload.remarks),
      travelDays: toNullableInteger(payload.travelDays),
      departureDate: toTrimmedString(payload.departureDate),
      returnDate: toTrimmedString(payload.returnDate),
      recommendingApproverId: toNullableInteger(payload.recommendingApproverId),
      hasOtherStaff: toBoolean(payload.hasOtherStaff, false),
      travelStatusRemarks: toTrimmedString(payload.travelStatusRemarks),
      trips,
      submitForApproval: toBoolean(payload.submitForApproval, true),
    },
  };
}

export function parseUpdateInput(
  payload: JsonObject,
): ParseResult<UpdateRegularTravelOrderInput> {
  const trips = parseTrips(payload.trips);
  if (trips === null) {
    return {
      ok: false,
      message: "Field `trips` must be an array of trip objects.",
    };
  }

  return {
    ok: true,
    data: {
      travelTypeId: toNullableInteger(payload.travelTypeId),
      transportationId: toNullableInteger(payload.transportationId),
      programId: toNullableInteger(payload.programId),
      specificDestination: toTrimmedString(payload.specificDestination),
      specificPurpose: toTrimmedString(payload.specificPurpose),
      fundingSource: toTrimmedString(payload.fundingSource),
      remarks: toTrimmedString(payload.remarks),
      travelDays: toNullableInteger(payload.travelDays),
      departureDate: toTrimmedString(payload.departureDate),
      returnDate: toTrimmedString(payload.returnDate),
      recommendingApproverId: toNullableInteger(payload.recommendingApproverId),
      hasOtherStaff: toBoolean(payload.hasOtherStaff, false),
      travelStatusRemarks: toTrimmedString(payload.travelStatusRemarks),
      trips,
    },
  };
}

export function statusFromMutationMessage(message: string): number {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("invalid travel-order reference")) {
    return 400;
  }
  if (
    normalized.includes("not found") ||
    normalized.includes("was not found for your account")
  ) {
    return 404;
  }
  if (
    normalized.includes("only pending travel orders can be edited") ||
    normalized.includes("no longer editable")
  ) {
    return 409;
  }
  if (normalized.includes("tables are not available yet")) {
    return 503;
  }

  return 422;
}

export async function assertTravelOrderReadable(
  session: SessionPayload,
  travelOrderId: number,
): Promise<
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; status: 404 | 503; message: string }>
> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<TravelOrderAccessRow[]>(
      `
        SELECT
          requester_user_id,
          recommending_approver_id
        FROM travel_orders
        WHERE travel_order_id = ?
        LIMIT 1
      `,
      [travelOrderId],
    );

    const row = rows[0];
    if (!row) {
      return {
        ok: false,
        status: 404,
        message: "Travel order was not found.",
      };
    }

    if (session.role === "admin") {
      return { ok: true };
    }

    if (
      session.role === "regular" &&
      row.requester_user_id === session.userId
    ) {
      return { ok: true };
    }

    if (
      session.role === "approver" &&
      row.recommending_approver_id === session.userId
    ) {
      return { ok: true };
    }

    return {
      ok: false,
      status: 404,
      message:
        session.role === "regular"
          ? "Travel order was not found for your account."
          : "Travel order was not found in your assigned requests.",
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        status: 503,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }

    throw error;
  }
}
