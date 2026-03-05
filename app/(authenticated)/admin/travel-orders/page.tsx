import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getAllTravelOrdersForAdminPaginated,
  type TravelOrderPagination,
  type TravelOrderSortColumn,
  type TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { AdminTravelOrdersView } from "@/src/components/admin/travel-orders/travel-orders-view";
import { TableSkeleton } from "@/src/components/ui/skeleton";
import { reviewTravelOrderStep2Action } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type AdminTravelOrdersPageProps = Readonly<{
  searchParams: SearchParams;
}>;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const search = firstQueryValue(searchParams.search);
  const status = firstQueryValue(searchParams.status) ?? "all";
  const sortBy = firstQueryValue(searchParams.sortBy) as TravelOrderSortColumn | undefined;
  const sortDir = firstQueryValue(searchParams.sortDir) as TravelOrderSortDirection | undefined;
  const page =
    typeof searchParams.page === "string"
      ? parseInt(searchParams.page, 10)
      : 1;
  const limit =
    typeof searchParams.limit === "string"
      ? parseInt(searchParams.limit, 10)
      : 10;

  return { search, status, sortBy, sortDir, page, limit };
}

function toPositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function getFeedback(searchParams: {
  [key: string]: string | string[] | undefined;
}):
  | Readonly<{
      type: "success" | "error";
      text: string;
    }>
  | undefined {
  const error = firstQueryValue(searchParams.error);
  if (error) {
    return { type: "error", text: error };
  }

  const reviewedOrderNo = firstQueryValue(searchParams.reviewed);
  if (reviewedOrderNo) {
    const result = firstQueryValue(searchParams.result);
    if (result === "rejected") {
      return {
        type: "success",
        text: `Travel order ${reviewedOrderNo} was rejected at step 2.`,
      };
    }

    if (result === "returned") {
      return {
        type: "success",
        text: `Travel order ${reviewedOrderNo} was returned to requester.`,
      };
    }

    return {
      type: "success",
      text: `Travel order ${reviewedOrderNo} was approved and finalized.`,
    };
  }

  return undefined;
}

function TableLoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
      <TableSkeleton rows={6} columns={8} />
    </div>
  );
}

async function TravelOrdersTableWrapper({
  searchParams,
  feedback,
}: {
  searchParams: SearchParams;
  feedback?: ReturnType<typeof getFeedback>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = parseSearchParams(resolvedSearchParams);
  const initialOrderId = toPositiveInteger(
    firstQueryValue(resolvedSearchParams.travelOrderId),
  );
  const result = await getAllTravelOrdersForAdminPaginated(filter);

  return (
    <AdminTravelOrdersView
      rows={result.items}
      pagination={result.pagination}
      currentFilter={filter}
      onReview={reviewTravelOrderStep2Action}
      initialOrderId={initialOrderId}
      feedback={feedback}
    />
  );
}

export default async function AdminTravelOrdersPage({
  searchParams,
}: AdminTravelOrdersPageProps) {
  const session = await requireRole("admin");
  const resolvedSearchParams = await searchParams;
  const userData = await getUserWithDivision(session.userId);
  const feedback = getFeedback(resolvedSearchParams);

  return (
    <AdminShell
      title="Travel Orders"
      activeItem="travel-orders"
      user={
        userData
          ? {
              name: `${userData.firstName} ${userData.lastName}`.trim(),
              role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
              division: userData.division ?? "No Division Assigned",
            }
          : undefined
      }
    >
      <Suspense fallback={<TableLoadingSkeleton />}>
        <TravelOrdersTableWrapper searchParams={searchParams} feedback={feedback} />
      </Suspense>
    </AdminShell>
  );
}
