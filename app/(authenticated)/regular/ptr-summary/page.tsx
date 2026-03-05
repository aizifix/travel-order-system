import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getPtrSummaryForRegular,
  type PtrSummaryFilter,
  type PtrSummaryPagination,
} from "@/src/server/ptr-summary/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import { PtrSummaryTable } from "@/src/components/ptr-summary/ptr-summary-table";
import { TableSkeleton } from "@/src/components/ui/skeleton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type RegularPtrSummaryPageProps = Readonly<{
  searchParams: SearchParams;
}>;

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): PtrSummaryFilter {
  const search = firstQueryValue(searchParams.search);
  const status = firstQueryValue(searchParams.status) ?? "all";
  const startDate = firstQueryValue(searchParams.startDate);
  const endDate = firstQueryValue(searchParams.endDate);
  const page =
    typeof searchParams.page === "string"
      ? parseInt(searchParams.page, 10)
      : 1;
  const limit =
    typeof searchParams.limit === "string"
      ? parseInt(searchParams.limit, 10)
      : 10;

  return { search, status, startDate, endDate, page, limit };
}

function TableLoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
      <TableSkeleton rows={6} columns={8} />
    </div>
  );
}

async function PtrSummaryContent({
  userId,
  filter,
}: {
  userId: number;
  filter: PtrSummaryFilter;
}) {
  const result = await getPtrSummaryForRegular(userId, filter);

  return (
    <PtrSummaryTable
      rows={result.items}
      pagination={result.pagination}
      currentFilter={filter}
      basePath="/regular/ptr-summary"
      title="My PTR Summary"
      subtitle="View your personal travel order summary"
    />
  );
}

export default async function RegularPtrSummaryPage({
  searchParams,
}: RegularPtrSummaryPageProps) {
  const session = await requireRole("regular");
  const resolvedSearchParams = await searchParams;
  const filter = parseSearchParams(resolvedSearchParams);

  const userData = await getUserWithDivision(session.userId);

  return (
    <RegularShell
      title="PTR Summary"
      activeItem="ptr-summary"
      user={
        userData
          ? {
              name: `${userData.firstName} ${userData.lastName}`.trim(),
              role:
                userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
              division: userData.division ?? "No Division Assigned",
            }
          : undefined
      }
    >
      <Suspense fallback={<TableLoadingSkeleton />}>
        <PtrSummaryContent userId={session.userId} filter={filter} />
      </Suspense>
    </RegularShell>
  );
}
