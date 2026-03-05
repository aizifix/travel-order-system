import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getPtrSummaryForAdmin,
  getDivisionsForFilter,
  type PtrSummaryFilter,
  type PtrSummaryPagination,
} from "@/src/server/ptr-summary/service";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { PtrSummaryTable } from "@/src/components/ptr-summary/ptr-summary-table";
import { TableSkeleton } from "@/src/components/ui/skeleton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type AdminPtrSummaryPageProps = Readonly<{
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
  const divisionId =
    typeof searchParams.divisionId === "string"
      ? parseInt(searchParams.divisionId, 10)
      : undefined;
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

  return { search, status, divisionId, startDate, endDate, page, limit };
}

function TableLoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
      <TableSkeleton rows={6} columns={9} />
    </div>
  );
}

async function PtrSummaryContent({
  filter,
}: {
  filter: PtrSummaryFilter;
}) {
  const [result, divisions] = await Promise.all([
    getPtrSummaryForAdmin(filter),
    getDivisionsForFilter(),
  ]);

  return (
    <PtrSummaryTable
      rows={result.items}
      pagination={result.pagination}
      currentFilter={filter}
      basePath="/admin/ptr-summary"
      title="PTR Summary"
      subtitle="View all travel order summaries with comprehensive filtering"
      showDivision={true}
      divisions={divisions}
    />
  );
}

export default async function AdminPtrSummaryPage({
  searchParams,
}: AdminPtrSummaryPageProps) {
  const session = await requireRole("admin");
  const resolvedSearchParams = await searchParams;
  const filter = parseSearchParams(resolvedSearchParams);

  const userData = await getUserWithDivision(session.userId);

  return (
    <AdminShell
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
        <PtrSummaryContent filter={filter} />
      </Suspense>
    </AdminShell>
  );
}
