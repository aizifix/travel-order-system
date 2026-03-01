"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/src/server/auth/guards";
import {
  reviewTravelOrderStep2,
  type AdminStep2Action,
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

function parseStep2Action(value: string): AdminStep2Action | null {
  if (value === "APPROVED" || value === "REJECTED" || value === "RETURNED") {
    return value;
  }
  return null;
}

export async function reviewTravelOrderStep2Action(
  formData: FormData,
): Promise<void> {
  const session = await requireRole("admin");
  const travelOrderId = toPositiveInteger(formData.get("travelOrderId"));
  const action = parseStep2Action(toTrimmedString(formData.get("action")));

  if (!travelOrderId || !action) {
    redirect(
      `/admin/travel-orders?error=${encodeURIComponent(
        "Travel order review request is invalid.",
      )}`,
    );
  }

  const remarks = toTrimmedString(formData.get("remarks"));

  let result: Awaited<ReturnType<typeof reviewTravelOrderStep2>>;
  try {
    result = await reviewTravelOrderStep2(session.userId, {
      travelOrderId,
      action,
      remarks,
    });
  } catch (error) {
    console.error("reviewTravelOrderStep2Action failed", error);
    redirect(
      `/admin/travel-orders?error=${encodeURIComponent(
        "Unable to save your review right now. Please try again.",
      )}`,
    );
  }

  if (!result.ok) {
    redirect(
      `/admin/travel-orders?error=${encodeURIComponent(result.message)}`,
    );
  }

  const resultLabels: Record<AdminStep2Action, string> = {
    APPROVED: "approved",
    REJECTED: "rejected",
    RETURNED: "returned",
  };

  redirect(
    `/admin/travel-orders?reviewed=${encodeURIComponent(
      result.orderNo,
    )}&result=${resultLabels[action]}&travelOrderId=${encodeURIComponent(
      String(travelOrderId),
    )}`,
  );
}
