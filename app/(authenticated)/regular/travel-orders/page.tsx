import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getRequesterTravelOrderProfile,
  getTravelOrderCreationLookups,
  getTravelOrdersForRequesterPaginated,
  type TravelOrderPagination,
  type TravelOrderSortColumn,
  type TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import { RegularTravelOrdersView } from "@/src/components/regular/travel-orders/regular-travel-orders-view";
import { TableSkeleton } from "@/src/components/ui/skeleton";
import {
  cancelRegularTravelOrderAction,
  createRegularTravelOrderAction,
  updateRegularTravelOrderAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type RegularTravelOrdersPageProps = Readonly<{
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

  const createdOrderNo = firstQueryValue(searchParams.created);
  if (createdOrderNo) {
    const mode = firstQueryValue(searchParams.mode);
    if (mode === "draft") {
      return {
        type: "success",
        text: `Travel order ${createdOrderNo} was saved as draft.`,
      };
    }

    return {
      type: "success",
      text: `Travel order ${createdOrderNo} was submitted for approval.`,
    };
  }

  const updatedOrderNo = firstQueryValue(searchParams.updated);
  if (updatedOrderNo) {
    return {
      type: "success",
      text: `Travel order ${updatedOrderNo} was updated successfully.`,
    };
  }

  return undefined;
}

async function TravelOrdersContent({
  userId,
  feedback,
  filter,
}: {
  userId: number;
  feedback: ReturnType<typeof getFeedback>;
  filter: ReturnType<typeof parseSearchParams>;
}) {
  const [profile, result] = await Promise.all([
    getRequesterTravelOrderProfile(userId),
    getTravelOrdersForRequesterPaginated(userId, filter),
  ]);

  const lookups = await getTravelOrderCreationLookups(profile?.divisionId ?? null);

  const pagination: TravelOrderPagination = result.pagination;

  return (
    <RegularTravelOrdersView
      profile={profile}
      lookups={lookups}
      rows={result.items}
      pagination={pagination}
      currentFilter={filter}
      onUpdate={updateRegularTravelOrderAction}
      onCancel={cancelRegularTravelOrderAction}
      feedback={feedback}
    />
  );
}

export default async function RegularTravelOrdersPage({
  searchParams,
}: RegularTravelOrdersPageProps) {
  const session = await requireRole("regular");
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedback(resolvedSearchParams);
  const filter = parseSearchParams(resolvedSearchParams);

  const userData = await getUserWithDivision(session.userId);

  return (
    <RegularShell
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
          feedback={feedback}
          filter={filter}
        />
      </Suspense>
    </RegularShell>
  );
}
