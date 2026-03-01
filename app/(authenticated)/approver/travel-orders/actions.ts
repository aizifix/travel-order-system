"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/src/server/auth/guards";
import {
  reviewTravelOrderStep1,
  type ApproverStep1Action,
} from "@/src/server/travel-orders/service";

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

function parseStep1Action(value: string): ApproverStep1Action | null {
  if (value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return null;
}

export async function reviewTravelOrderStep1Action(
  formData: FormData,
): Promise<void> {
  const session = await requireRole("approver");
  const travelOrderId = toPositiveInteger(formData.get("travelOrderId"));
  const action = parseStep1Action(toTrimmedString(formData.get("action")));

  if (!travelOrderId || !action) {
    redirect(
      `/approver/travel-orders?error=${encodeURIComponent(
        "Travel order review request is invalid.",
      )}`,
    );
  }

  const remarks = toTrimmedString(formData.get("remarks"));

  let result: Awaited<ReturnType<typeof reviewTravelOrderStep1>>;
  try {
    result = await reviewTravelOrderStep1(session.userId, {
      travelOrderId,
      action,
      remarks,
    });
  } catch (error) {
    console.error("reviewTravelOrderStep1Action failed", error);
    redirect(
      `/approver/travel-orders?error=${encodeURIComponent(
        "Unable to save your review right now. Please try again.",
      )}`,
    );
  }

  if (!result.ok) {
    redirect(
      `/approver/travel-orders?error=${encodeURIComponent(result.message)}`,
    );
  }

  const resultLabel = action === "APPROVED" ? "approved" : "rejected";
  redirect(
    `/approver/travel-orders?reviewed=${encodeURIComponent(
      result.orderNo,
    )}&result=${resultLabel}`,
  );
}
