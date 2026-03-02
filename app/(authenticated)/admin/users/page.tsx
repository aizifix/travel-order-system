import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import {
  getUserCreationLookups,
  getUsers,
  getUserWithDivision,
  type UserFilter,
} from "@/src/server/auth/service";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { UsersTable, type UserTableRow } from "@/src/components/admin/users/users-table";
import { UsersFilters } from "@/src/components/admin/users/users-filters";
import type { UserRole } from "@/src/server/auth/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface UsersPageProps {
  searchParams: SearchParams;
}

function parseSearchParams(searchParams: {
  search?: string | string[];
  role?: string | string[];
  isActive?: string | string[];
  page?: string | string[];
  limit?: string | string[];
}): UserFilter {
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const role =
    typeof searchParams.role === "string" && searchParams.role !== "all"
      ? (searchParams.role as UserRole)
      : "all";
  const isActive =
    searchParams.isActive === "true"
      ? true
      : searchParams.isActive === "false"
        ? false
        : "all";
  const page =
    typeof searchParams.page === "string"
      ? parseInt(searchParams.page, 10)
      : 1;
  const limit =
    typeof searchParams.limit === "string"
      ? parseInt(searchParams.limit, 10)
      : 10;

  return { search, role, isActive, page, limit };
}

async function UsersContent({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filter = parseSearchParams(resolvedSearchParams);
  const [result, userCreationLookups] = await Promise.all([
    getUsers(filter),
    getUserCreationLookups(),
  ]);

  const userRows: readonly UserTableRow[] = result.users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    division: user.division,
    position: user.position,
    designation: user.designation,
    createdAt: user.createdAt,
  }));

  return (
    <>
      <UsersFilters
        currentSearch={filter.search ?? ""}
        currentRole={filter.role ?? "all"}
        currentIsActive={filter.isActive ?? "all"}
        lookups={userCreationLookups}
      />
      <UsersTable
        rows={userRows}
        pagination={{
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        }}
      />
    </>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const session = await requireRole("admin");
  const userData = await getUserWithDivision(session.userId);

  return (
    <AdminShell
      title="Users"
      activeItem="users"
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
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B9F41] border-t-transparent" />
          </div>
        }
      >
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}
