import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireRole } from "@/src/server/auth/guards";
import { getDbPool } from "@/src/server/db/mysql";
import { createRegularTravelOrder } from "@/src/server/travel-orders/service";
import type { TravelOrderTripInput } from "@/src/server/travel-orders/service";

const ATTACHMENT_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "travel-order-attachments",
);
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
const MAX_TRAVEL_ORDER_DAYS = 5;
const ONE_DAY_MS = 86_400_000;

type FieldError = {
  field: string;
  message: string;
};

type ValidationResult =
  | { valid: true }
  | { valid: false; errors: FieldError[] };

type ParsedTripFieldsResult =
  | Readonly<{
      ok: true;
      trips: readonly TravelOrderTripInput[];
      specificDestination: string;
      specificPurpose: string;
      travelDays: number;
      departureDate: string;
      returnDate: string;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }>;

function toTrimmedString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNullableInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  return toPositiveInteger(value);
}

function toTrimmedStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((value) => value.length > 0);
}

function normalizePdfFile(entry: FormDataEntryValue | null): File | null {
  if (!(entry instanceof File)) {
    return null;
  }
  if (!entry.name || entry.size <= 0) {
    return null;
  }
  return entry;
}

function sanitizeFileNamePart(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return safe.length > 0 ? safe : "attachment";
}

function buildEnrichedRemarks(formData: FormData): string {
  const baseRemarks = toTrimmedString(formData.get("remarks"));
  const locationVenue = toTrimmedString(formData.get("locationVenue"));
  const objectives = toTrimmedString(formData.get("objectives"));

  const staffNames = toTrimmedStringArray(formData, "otherStaffNames[]");
  const staffDivisions = toTrimmedStringArray(formData, "otherStaffDivisions[]");
  const staffPositions = toTrimmedStringArray(formData, "otherStaffPositions[]");

  const staffLines = staffNames.map((name, index) => {
    const division = staffDivisions[index] ?? "";
    const position = staffPositions[index] ?? "";
    const parts = [name, position, division].filter((part) => part.length > 0);
    return parts.join(" | ");
  });

  const supplemental: string[] = [];
  if (locationVenue) {
    supplemental.push(`Location/Venue: ${locationVenue}`);
  }
  if (objectives) {
    supplemental.push(`Objective(s): ${objectives}`);
  }
  if (staffLines.length > 0) {
    supplemental.push(`Other Staff Name(s): ${staffLines.join("; ")}`);
  }

  if (supplemental.length === 0) {
    return baseRemarks;
  }

  if (!baseRemarks) {
    return supplemental.join("\n");
  }

  return `${baseRemarks}\n\n${supplemental.join("\n")}`;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function getInclusiveRangeDays(startIso: string, endIso: string): number | null {
  if (!isIsoDate(startIso) || !isIsoDate(endIso)) {
    return null;
  }

  const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
  const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
  if (endMs < startMs) {
    return null;
  }

  return Math.floor((endMs - startMs) / ONE_DAY_MS) + 1;
}

function normalizeTripsForSubmission(
  rawTrips: readonly TravelOrderTripInput[],
): ParsedTripFieldsResult {
  if (rawTrips.length === 0) {
    return {
      ok: false,
      message: "At least one trip destination is required.",
    };
  }

  const validatedTrips: TravelOrderTripInput[] = [];

  for (const [index, rawTrip] of rawTrips.entries()) {
    const specificDestination = toTrimmedString(rawTrip.specificDestination);
    const specificPurpose = toTrimmedString(rawTrip.specificPurpose);
    const departureDate = toTrimmedString(rawTrip.departureDate);
    const returnDate = toTrimmedString(rawTrip.returnDate);
    const tripLabel = `Trip ${index + 1}`;

    if (!specificDestination || !specificPurpose) {
      return {
        ok: false,
        message: `${tripLabel} requires both specific destination and specific purpose.`,
      };
    }

    const dayCount = getInclusiveRangeDays(departureDate, returnDate);
    if (dayCount == null) {
      return {
        ok: false,
        message: `${tripLabel} must include a valid departure and return date range.`,
      };
    }

    validatedTrips.push({
      specificDestination,
      specificPurpose,
      departureDate,
      returnDate,
    });
  }

  const sortedTrips = [...validatedTrips].sort((left, right) => {
    const departureDiff = left.departureDate.localeCompare(right.departureDate);
    if (departureDiff !== 0) {
      return departureDiff;
    }

    return left.returnDate.localeCompare(right.returnDate);
  });

  for (let index = 1; index < sortedTrips.length; index += 1) {
    const previousTrip = sortedTrips[index - 1];
    const currentTrip = sortedTrips[index];

    if (currentTrip.departureDate <= previousTrip.returnDate) {
      return {
        ok: false,
        message: "Trip dates must not overlap. Adjust the date ranges and try again.",
      };
    }
  }

  const totalDays = sortedTrips.reduce((sum, trip) => {
    const tripDays = getInclusiveRangeDays(trip.departureDate, trip.returnDate);
    return sum + (tripDays ?? 0);
  }, 0);

  if (totalDays < 1 || totalDays > MAX_TRAVEL_ORDER_DAYS) {
    return {
      ok: false,
      message: `Total travel days across all trips must be between 1 and ${MAX_TRAVEL_ORDER_DAYS}.`,
    };
  }

  return {
    ok: true,
    trips: sortedTrips,
    specificDestination: sortedTrips.map((trip) => trip.specificDestination).join("\n"),
    specificPurpose: sortedTrips.map((trip) => trip.specificPurpose).join("\n"),
    travelDays: totalDays,
    departureDate: sortedTrips[0]?.departureDate ?? "",
    returnDate: sortedTrips[sortedTrips.length - 1]?.returnDate ?? "",
  };
}

function parseTripsFromJsonField(formData: FormData): ParsedTripFieldsResult | null {
  const rawTripsJson = toTrimmedString(formData.get("tripsJson"));
  if (!rawTripsJson) {
    return null;
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawTripsJson);
  } catch {
    return {
      ok: false,
      message: "Trip details are invalid. Please review your trip destinations.",
    };
  }

  if (!Array.isArray(parsedPayload)) {
    return {
      ok: false,
      message: "Trip details must be submitted as an array.",
    };
  }

  const rawTrips: TravelOrderTripInput[] = [];

  for (const entry of parsedPayload) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return {
        ok: false,
        message: "Trip details are malformed. Please review your trip entries.",
      };
    }

    const trip = entry as Record<string, unknown>;
    rawTrips.push({
      specificDestination:
        typeof trip.specificDestination === "string" ? trip.specificDestination : "",
      specificPurpose:
        typeof trip.specificPurpose === "string" ? trip.specificPurpose : "",
      departureDate:
        typeof trip.departureDate === "string" ? trip.departureDate : "",
      returnDate: typeof trip.returnDate === "string" ? trip.returnDate : "",
    });
  }

  return normalizeTripsForSubmission(rawTrips);
}

function parseTripFields(formData: FormData): ParsedTripFieldsResult {
  const parsedFromJson = parseTripsFromJsonField(formData);
  if (parsedFromJson) {
    return parsedFromJson;
  }

  // Fallback: try legacy daily plan fields parsing
  const firstDayDestination = toTrimmedString(formData.get("specificDestination"));
  const firstDayPurpose = toTrimmedString(formData.get("specificPurpose"));
  const travelDays = toPositiveInteger(formData.get("travelDays"));
  const departureDate = toTrimmedString(formData.get("departureDate"));
  const returnDate = toTrimmedString(formData.get("returnDate"));

  if (!firstDayDestination || !firstDayPurpose) {
    return {
      ok: false,
      message: "Day 1 requires both specific destination and specific purpose.",
    };
  }

  if (!travelDays || travelDays < 1) {
    return {
      ok: false,
      message: "Travel days is required.",
    };
  }

  const inclusiveDays = getInclusiveRangeDays(departureDate, returnDate);
  if (inclusiveDays == null) {
    return {
      ok: false,
      message: "Travel dates must include a valid departure and return range.",
    };
  }

  if (inclusiveDays !== travelDays) {
    return {
      ok: false,
      message:
        "Travel days must match the inclusive range between departure and return dates.",
    };
  }

  const rawTrips: TravelOrderTripInput[] = [
    {
      specificDestination: firstDayDestination,
      specificPurpose: firstDayPurpose,
      departureDate,
      returnDate: departureDate,
    },
  ];

  return normalizeTripsForSubmission(rawTrips);
}

function validateFormData(formData: FormData): ValidationResult {
  const errors: FieldError[] = [];

  // Validate required fields
  const travelTypeId = toPositiveInteger(formData.get("travelTypeId"));
  if (!travelTypeId) {
    errors.push({ field: "travelTypeId", message: "Type of Travel is required" });
  }

  const transportationId = toPositiveInteger(formData.get("transportationId"));
  if (!transportationId) {
    errors.push({ field: "transportationId", message: "Means of Transportation is required" });
  }

  const programId = toNullableInteger(formData.get("programId"));
  // Program is optional

  const recommendingApproverId = toNullableInteger(formData.get("recommendingApproverId"));
  if (!recommendingApproverId) {
    errors.push({ field: "recommendingApproverId", message: "Recommending Approval is required" });
  }

  const fundingSource = toTrimmedString(formData.get("fundingSource"));
  if (!fundingSource) {
    errors.push({ field: "fundingSource", message: "Funding Source is required" });
  }

  // Validate trip fields
  const parsedTripFields = parseTripFields(formData);
  if (!parsedTripFields.ok) {
    errors.push({ field: "trips", message: parsedTripFields.message });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

async function saveSupportingLetterAttachment(
  travelOrderId: number,
  uploadedBy: number,
  file: File,
): Promise<void> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const pool = getDbPool();

  await mkdir(ATTACHMENT_UPLOAD_DIR, { recursive: true });

  const safeBase = sanitizeFileNamePart(path.parse(file.name).name);
  const storedFileName = `${travelOrderId}_${Date.now()}_${randomUUID()}_${safeBase}.pdf`;
  const absolutePath = path.join(ATTACHMENT_UPLOAD_DIR, storedFileName);
  const publicPath = `/uploads/travel-order-attachments/${storedFileName}`;

  await writeFile(absolutePath, fileBuffer);

  await pool.execute(
    `
      INSERT INTO travel_order_attachments (
        travel_order_id,
        file_name,
        file_path,
        file_size,
        mime_type,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [travelOrderId, file.name, publicPath, file.size, PDF_MIME_TYPE, uploadedBy],
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("regular");

    const formData = await request.formData();
    const actionType = toTrimmedString(formData.get("actionType")) === "draft"
      ? "draft"
      : "submit";

    // Validate form data
    const validationResult = validateFormData(formData);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, errors: validationResult.errors },
        { status: 400 },
      );
    }

    const parsedTripFields = parseTripFields(formData);
    if (!parsedTripFields.ok) {
      return NextResponse.json(
        { success: false, errors: [{ field: "trips", message: parsedTripFields.message }] },
        { status: 400 },
      );
    }

    const supportingLetter = normalizePdfFile(formData.get("supportingLetterPdf"));

    const isSubmit = actionType === "submit";

    const travelOrderData = {
      travelTypeId: toPositiveInteger(formData.get("travelTypeId"))!,
      transportationId: toPositiveInteger(formData.get("transportationId"))!,
      programId: toNullableInteger(formData.get("programId")),
      specificDestination: parsedTripFields.specificDestination,
      specificPurpose: parsedTripFields.specificPurpose,
      fundingSource: toTrimmedString(formData.get("fundingSource")),
      remarks: buildEnrichedRemarks(formData),
      travelDays: parsedTripFields.travelDays,
      departureDate: parsedTripFields.departureDate,
      returnDate: parsedTripFields.returnDate,
      recommendingApproverId: toNullableInteger(formData.get("recommendingApproverId"))!,
      hasOtherStaff: formData.get("hasOtherStaff") === "on",
      travelStatusRemarks: toTrimmedString(formData.get("travelStatusRemarks")),
      trips: parsedTripFields.trips,
      submitForApproval: isSubmit,
    };

    // Create travel order
    const createResult = await createRegularTravelOrder(
      session.userId,
      travelOrderData,
    );

    if (!createResult.ok) {
      return NextResponse.json(
        { success: false, errors: [{ field: "_form", message: createResult.message }] },
        { status: 400 },
      );
    }

    const travelOrderId = createResult.travelOrderId;

    // Save attachment if provided
    if (supportingLetter) {
      if (supportingLetter.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          {
            success: false,
            errors: [
              {
                field: "supportingLetterPdf",
                message: "File size exceeds 10 MB limit",
              },
            ],
          },
          { status: 400 },
        );
      }

      try {
        await saveSupportingLetterAttachment(travelOrderId, session.userId, supportingLetter);
      } catch (attachmentError) {
        console.error("Failed to save attachment:", attachmentError);
        // Continue anyway - the travel order was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      travelOrderId,
      redirectUrl: "/regular/travel-orders",
    });
  } catch (error) {
    console.error("Error creating travel order:", error);
    return NextResponse.json(
      { success: false, errors: [{ field: "_form", message: "An unexpected error occurred. Please try again." }] },
      { status: 500 },
    );
  }
}
