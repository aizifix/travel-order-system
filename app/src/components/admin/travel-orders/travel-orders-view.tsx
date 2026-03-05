"use client";

import dynamic from "next/dynamic";
import type {
  AdminTravelOrderItem,
  TravelOrderPagination,
  TravelOrderSortColumn,
  TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { TableSkeleton } from "@/src/components/ui/skeleton";

const AdminTravelOrdersTable = dynamic(
  () => import("@/src/components/admin/travel-orders/admin-travel-orders-table").then((mod) => ({ default: mod.AdminTravelOrdersTable })),
  {
    loading: () => (
      <div className="rounded-xl border border-[#dfe1ed] bg-white p-6">
        <TableSkeleton rows={6} columns={8} />
      </div>
    ),
  }
);

type CurrentFilter = Readonly<{
  search?: string;
  status?: string;
  sortBy?: TravelOrderSortColumn;
  sortDir?: TravelOrderSortDirection;
  page?: number;
  limit?: number;
}>;

type AdminTravelOrdersViewProps = Readonly<{
  rows: readonly AdminTravelOrderItem[];
  pagination?: TravelOrderPagination;
  currentFilter?: CurrentFilter;
  onReview: (formData: FormData) => Promise<void>;
  initialOrderId?: number;
  feedback?: Readonly<{
    type: "success" | "error";
    text: string;
  }>;
}>;

export function AdminTravelOrdersView({
  rows,
  pagination,
  currentFilter,
  onReview,
  initialOrderId,
  feedback,
}: AdminTravelOrdersViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[#2f3339] sm:text-2xl">
          Travel Orders Management
        </h2>
        <p className="mt-1 text-sm text-[#5d6780]">
          Manage all travel orders in the system. Click on any row to view details,
          track approvals, and perform final reviews.
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
      </div>

      <AdminTravelOrdersTable
        rows={rows}
        pagination={pagination}
        currentFilter={currentFilter}
        onReview={onReview}
        initialOrderId={initialOrderId}
      />
    </div>
  );
}
