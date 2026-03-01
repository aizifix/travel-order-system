"use client";

import dynamic from "next/dynamic";
import type { ApproverTravelOrderItem } from "@/src/server/travel-orders/service";
import { TableSkeleton } from "@/src/components/ui/skeleton";

// Lazy load the heavy table component
const ApproverTravelOrdersTable = dynamic(
  () => import("@/src/components/approver/travel-orders/approver-travel-orders-table").then((mod) => ({ default: mod.ApproverTravelOrdersTable })),
  {
    loading: () => <TableSkeleton rows={6} columns={8} />,
    ssr: false,
  }
);

type ApproverTravelOrdersViewProps = Readonly<{
  rows: readonly ApproverTravelOrderItem[];
  onReview: (formData: FormData) => Promise<void>;
  initialOrderId?: number;
  feedback?: Readonly<{
    type: "success" | "error";
    text: string;
  }>;
}>;

export function ApproverTravelOrdersView({
  rows,
  onReview,
  initialOrderId,
  feedback,
}: ApproverTravelOrdersViewProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-[#2f3339] sm:text-2xl">
          New Travel Order Requests
        </h2>
        <p className="mt-1 text-sm text-[#5d6780]">
          You are the first approver. Review assigned requests, then confirm or
          reject with a reason.
        </p>

        {feedback ? (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "success"
                ? "border-[#cdeedb] bg-[#f1fbf5] text-[#1f7d42]"
                : "border-[#ffcece] bg-[#fff3f3] text-[#a33a3a]"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        <div className="mt-4">
          <ApproverTravelOrdersTable
            rows={rows}
            onReview={onReview}
            initialOrderId={initialOrderId}
          />
        </div>
      </section>
    </div>
  );
}
