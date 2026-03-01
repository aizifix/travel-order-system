"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { requireRole } from "@/src/server/auth/guards";
import { getDbPool } from "@/src/server/db/mysql";
import {
  cancelRegularTravelOrder,
  createRegularTravelOrder,
  updateRegularTravelOrder,
} from "@/src/server/travel-orders/service";

const ATTACHMENT_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "travel-order-attachments",
);
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

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

function isPdfFile(file: File): boolean {
  const hasPdfMime = file.type === PDF_MIME_TYPE;
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  return hasPdfMime || hasPdfExtension;
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

function getDailyPlanSpecificFields(formData: FormData):
  | Readonly<{
      ok: true;
      specificDestination: string;
      specificPurpose: string;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }> {
  const dailyDates = formData
    .getAll("travelPlanDates[]")
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""));
  const dailyDestinations = formData
    .getAll("travelPlanDestinations[]")
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""));
  const dailyPurposes = formData
    .getAll("travelPlanPurposes[]")
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""));
  const firstDayDestination = toTrimmedString(formData.get("specificDestination"));
  const firstDayPurpose = toTrimmedString(formData.get("specificPurpose"));
  const travelDays = toPositiveInteger(formData.get("travelDays"));

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

  const expectedAdditionalDays = Math.max(0, travelDays - 1);

  if (
    dailyDestinations.length !== expectedAdditionalDays ||
    dailyPurposes.length !== expectedAdditionalDays ||
    dailyDates.length !== expectedAdditionalDays
  ) {
    return {
      ok: false,
      message:
        "Additional day entries are incomplete. Please review day 2 onward.",
    };
  }

  for (let index = 0; index < expectedAdditionalDays; index += 1) {
    if (!dailyDestinations[index] || !dailyPurposes[index]) {
      return {
        ok: false,
        message:
          `Day ${index + 2} requires both specific destination and specific purpose.`,
      };
    }
  }

  return {
    ok: true,
    specificDestination: [firstDayDestination, ...dailyDestinations].join("\n"),
    specificPurpose: [firstDayPurpose, ...dailyPurposes].join("\n"),
  };
}

function toTravelOrderMutableInput(formData: FormData):
  | Readonly<{
      ok: true;
      data: {
        travelTypeId: number | null;
        transportationId: number | null;
        programId: number | null;
        specificDestination: string;
        specificPurpose: string;
        fundingSource: string;
        remarks: string;
        travelDays: number | null;
        departureDate: string;
        returnDate: string;
        recommendingApproverId: number | null;
        hasOtherStaff: boolean;
        travelStatusRemarks: string;
      };
    }>
  | Readonly<{
      ok: false;
      message: string;
    }> {
  const dailyPlanSpecifics = getDailyPlanSpecificFields(formData);
  if (!dailyPlanSpecifics.ok) {
    return dailyPlanSpecifics;
  }

  return {
    ok: true,
    data: {
      travelTypeId: toPositiveInteger(formData.get("travelTypeId")),
      transportationId: toPositiveInteger(formData.get("transportationId")),
      programId: toNullableInteger(formData.get("programId")),
      specificDestination: dailyPlanSpecifics.specificDestination,
      specificPurpose: dailyPlanSpecifics.specificPurpose,
      fundingSource: toTrimmedString(formData.get("fundingSource")),
      remarks: buildEnrichedRemarks(formData),
      travelDays: toPositiveInteger(formData.get("travelDays")),
      departureDate: toTrimmedString(formData.get("departureDate")),
      returnDate: toTrimmedString(formData.get("returnDate")),
      recommendingApproverId: toNullableInteger(formData.get("recommendingApproverId")),
      hasOtherStaff: formData.get("hasOtherStaff") === "on",
      travelStatusRemarks: toTrimmedString(formData.get("travelStatusRemarks")),
    },
  };
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

export async function createRegularTravelOrderAction(
  formData: FormData,
): Promise<void> {
  const session = await requireRole("regular");
  const actionType = toTrimmedString(formData.get("actionType")) === "draft"
    ? "draft"
    : "submit";
  const mutableInputResult = toTravelOrderMutableInput(formData);
  const supportingLetter = normalizePdfFile(formData.get("supportingLetterPdf"));

  if (!mutableInputResult.ok) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(mutableInputResult.message)}`,
    );
  }

  if (supportingLetter) {
    if (!isPdfFile(supportingLetter)) {
      redirect(
        `/regular/travel-orders?error=${encodeURIComponent(
          "Supporting letter must be a PDF file.",
        )}`,
      );
    }
    if (supportingLetter.size > MAX_ATTACHMENT_BYTES) {
      redirect(
        `/regular/travel-orders?error=${encodeURIComponent(
          "Supporting letter must be 10 MB or smaller.",
        )}`,
      );
    }
  }

  let result: Awaited<ReturnType<typeof createRegularTravelOrder>>;
  try {
    result = await createRegularTravelOrder(session.userId, {
      ...mutableInputResult.data,
      submitForApproval: actionType === "submit",
    });
  } catch (error) {
    console.error("createRegularTravelOrderAction failed", error);
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(
        "Unable to create travel order right now. Please try again.",
      )}`,
    );
  }

  if (!result.ok) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(result.message)}`,
    );
  }

  if (supportingLetter) {
    try {
      await saveSupportingLetterAttachment(
        result.travelOrderId,
        session.userId,
        supportingLetter,
      );
    } catch (error) {
      console.error("saveSupportingLetterAttachment failed", error);
    }
  }

  redirect(
    `/regular/travel-orders?created=${encodeURIComponent(
      result.orderNo,
    )}&mode=${actionType}`,
  );
}

export async function updateRegularTravelOrderAction(
  formData: FormData,
): Promise<void> {
  const session = await requireRole("regular");
  const travelOrderId = toPositiveInteger(formData.get("travelOrderId"));
  const mutableInputResult = toTravelOrderMutableInput(formData);

  if (!travelOrderId) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(
        "Travel order reference is missing.",
      )}`,
    );
  }

  if (!mutableInputResult.ok) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(mutableInputResult.message)}`,
    );
  }

  let result: Awaited<ReturnType<typeof updateRegularTravelOrder>>;
  try {
    result = await updateRegularTravelOrder(
      session.userId,
      travelOrderId,
      mutableInputResult.data,
    );
  } catch (error) {
    console.error("updateRegularTravelOrderAction failed", error);
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(
        "Unable to update the travel order right now. Please try again.",
      )}`,
    );
  }

  if (!result.ok) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(
    `/regular/travel-orders?updated=${encodeURIComponent(result.orderNo)}`,
  );
}

export async function cancelRegularTravelOrderAction(
  formData: FormData,
): Promise<void> {
  const session = await requireRole("regular");
  const travelOrderId = toPositiveInteger(formData.get("travelOrderId"));

  if (!travelOrderId) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(
        "Travel order reference is missing.",
      )}`,
    );
  }

  const reason = toTrimmedString(formData.get("cancelReason"));

  let result: Awaited<ReturnType<typeof cancelRegularTravelOrder>>;
  try {
    result = await cancelRegularTravelOrder(session.userId, travelOrderId, reason);
  } catch (error) {
    console.error("cancelRegularTravelOrderAction failed", error);
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(
        "Unable to cancel the travel order right now. Please try again.",
      )}`,
    );
  }

  if (!result.ok) {
    redirect(
      `/regular/travel-orders?error=${encodeURIComponent(result.message)}`,
    );
  }

  redirect(
    `/regular/travel-orders?cancelled=${encodeURIComponent(result.orderNo)}`,
  );
}
