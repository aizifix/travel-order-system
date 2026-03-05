import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getTravelOrdersForApproverPaginated,
  type TravelOrderPagination,
  type TravelOrderSortColumn,
  type TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { ApproverShell } from "@/src/components/approver/approver-shell";
import { ApproverTravelOrdersView } from "@/src/components/approver/travel-orders/approver-travel-orders-view";
import { TableSkeleton } from "@/src/components/ui/skeleton";
import { reviewTravelOrderStep1Action } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type ApproverTravelOrdersPageProps = Readonly<{
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
        text: `Travel order ${reviewedOrderNo} was rejected at step 1.`,
      };
    }

    return {
      type: "success",
      text: `Travel order ${reviewedOrderNo} was confirmed and forwarded to RED/Admin.`,
    };
  }

  return undefined;
}

async function TravelOrdersContent({
  userId,
  initialOrderId,
  feedback,
  filter,
}: {
  userId: number;
  initialOrderId: number | undefined;
  feedback: ReturnType<typeof getFeedback>;
  filter: ReturnType<typeof parseSearchParams>;
}) {
  const result = await getTravelOrdersForApproverPaginated(userId, filter);

  return (
    <ApproverTravelOrdersView
      rows={result.items}
      pagination={result.pagination}
      currentFilter={filter}
      onReview={reviewTravelOrderStep1Action}
      initialOrderId={initialOrderId}
      feedback={feedback}
    />
  );
}

export default async function ApproverTravelOrdersPage({
  searchParams,
}: ApproverTravelOrdersPageProps) {
  const session = await requireRole("approver");
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedback(resolvedSearchParams);
  const initialOrderId = toPositiveInteger(
    firstQueryValue(resolvedSearchParams.travelOrderId),
  );
  const filter = parseSearchParams(resolvedSearchParams);

  const userData = await getUserWithDivision(session.userId);

  return (
    <ApproverShell
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
      <Suspense
        fallback={
          <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
            <TableSkeleton rows={6} columns={8} />
          </div>
        }
      >
        <TravelOrdersContent
          userId={session.userId}
          initialOrderId={initialOrderId}
          feedback={feedback}
          filter={filter}
        />
      </Suspense>
    </ApproverShell>
  );
}
