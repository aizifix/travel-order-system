"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pencil,
  Archive,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/src/components/ui/toast-provider";
import { ModalSkeleton } from "@/src/components/ui/skeleton";
import type { UserRole } from "@/src/server/auth/types";
import { useDrawerFocusManagement } from "@/src/hooks/useDrawerFocusManagement";
import { useVirtualRows } from "@/src/hooks/useVirtualRows";
import type { UserCreationLookups } from "@/src/components/admin/users/add-user-modal";

export type UserTableRow = Readonly<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  division: string | null;
  position: string | null;
  designation: string | null;
  createdAt: Date;
}>;

export type UserPagination = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

type UsersTableProps = Readonly<{
  rows: readonly UserTableRow[];
  pagination?: UserPagination;
  lookups: UserCreationLookups;
  currentSearch: string;
  currentRole: UserRole | "all";
  currentIsActive: boolean | "all";
}>;

const VIRTUAL_SCROLL_THRESHOLD = 50;
const VIRTUAL_ROW_HEIGHT = 56;

const UserDetailDrawer = dynamic(
  () => import("@/src/components/admin/users/user-detail-drawer").then((mod) => ({
    default: mod.UserDetailDrawer,
  })),
  {
    ssr: false,
    loading: () => <DrawerPanelFallback />,
  },
);

const AddUserModal = dynamic(
  () =>
    import("@/src/components/admin/users/add-user-modal").then((mod) => ({
      default: mod.AddUserModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  },
);

export function UsersTable({
  rows,
  pagination,
  lookups,
  currentSearch,
  currentRole,
  currentIsActive,
}: UsersTableProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const handleRowClick = useCallback(
    (user: UserTableRow, triggerElement?: HTMLElement | null) => {
      if (triggerElement) {
        returnFocusRef.current = triggerElement;
      } else if (document.activeElement instanceof HTMLElement) {
        returnFocusRef.current = document.activeElement;
      }

      setSelectedUser(user);
      requestAnimationFrame(() => {
        setIsDrawerOpen(true);
      });
    },
    [],
  );

  const handleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTableRowElement>, user: UserTableRow) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleRowClick(user, event.currentTarget);
      }
    },
    [handleRowClick],
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  }, []);

  const handleEditUser = (userId: number) => {
    setOpenMenuId(null);
    router.push(`/admin/users/${userId}/edit`);
  };

  const handleArchiveUser = async (userId: number) => {
    setOpenMenuId(null);
    try {
      const response = await fetch(`/api/users/${userId}/archive`, {
        method: "POST",
      });
      if (response.ok) {
        showToast({
          type: "success",
          title: "User archived",
        });
        router.refresh();
      } else {
        showToast({
          type: "error",
          title: "Archive failed",
          description: "Unable to archive this user.",
        });
      }
    } catch {
      showToast({
        type: "error",
        title: "Archive failed",
        description: "A network error occurred. Please try again.",
      });
    }
  };

  const toggleMenu = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (
        isDrawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        handleCloseDrawer();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleCloseDrawer, isDrawerOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDrawerOpen) {
        handleCloseDrawer();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleCloseDrawer, isDrawerOpen]);

  useEffect(() => {
    if (isDrawerOpen || isAddUserModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, isAddUserModalOpen]);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  useDrawerFocusManagement({
    isOpen: isDrawerOpen,
    drawerRef,
    returnFocusRef,
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const shouldVirtualizeRows = rows.length > VIRTUAL_SCROLL_THRESHOLD;
  const {
    containerRef: tableScrollRef,
    handleScroll: handleTableScroll,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
  } = useVirtualRows({
    rowCount: rows.length,
    estimateRowHeight: VIRTUAL_ROW_HEIGHT,
    enabled: shouldVirtualizeRows,
  });
  const visibleRows = shouldVirtualizeRows ? rows.slice(startIndex, endIndex) : rows;

  const handleAddUser = useCallback(() => {
    setIsAddUserModalOpen(true);
  }, []);

  const handleCloseAddUserModal = useCallback(() => {
    setIsAddUserModalOpen(false);
  }, []);

  const handleUserCreated = useCallback(() => {
    setIsAddUserModalOpen(false);
    router.refresh();
  }, [router]);

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateFilters("search", search);
    },
    [search, updateFilters],
  );

  const handleRoleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      updateFilters("role", event.target.value);
    },
    [updateFilters],
  );

  const handleStatusChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      updateFilters("isActive", event.target.value);
    },
    [updateFilters],
  );

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-white">
      <div className="border-b border-[#dfe1ed] px-4 py-3">
        <p className="text-base font-semibold text-[#2f3339]">Users</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca7bd]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white pl-10 pr-4 text-sm text-[#2f3339] placeholder-[#9ca7bd] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white text-[#5d6780]"
                aria-hidden="true"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </div>

              <select
                value={currentRole}
                onChange={handleRoleChange}
                className="h-10 min-w-[140px] rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="approver">Approver</option>
                <option value="regular">Regular</option>
              </select>

              <select
                value={String(currentIsActive)}
                onChange={handleStatusChange}
                className="h-10 min-w-[140px] rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
              >
                <option value="all">All status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </form>

          <button
            type="button"
            onClick={handleAddUser}
            className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436] lg:self-auto"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      <div
        ref={tableScrollRef}
        onScroll={handleTableScroll}
        className="overflow-x-auto overflow-y-auto w-full max-h-[calc(100vh-320px)]"
      >
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead className="bg-[#f3f5fa] text-[#5d6780] sticky top-0 z-10">
            <tr className="border-b border-[#cfd4e2]">
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Email</HeaderCell>
              <HeaderCell>Role</HeaderCell>
              <HeaderCell>Division</HeaderCell>
              <HeaderCell>Position</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Created</HeaderCell>
              <HeaderCell>Action</HeaderCell>
            </tr>
          </thead>

          <tbody className="text-sm text-[#4a5266]">
            {rows.length > 0 ? (
              <>
                {shouldVirtualizeRows && topSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={8} style={{ height: `${topSpacerHeight}px`, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#dfe1ed] cursor-pointer transition-colors hover:bg-[#f8f9fc] focus:outline-none focus-visible:bg-[#f8f9fc] last:border-b-0"
                    onClick={(event) => handleRowClick(row, event.currentTarget)}
                    onKeyDown={(event) => handleRowKeyDown(event, row)}
                    tabIndex={0}
                    aria-label={`Open details for ${row.firstName} ${row.lastName}`}
                  >
                    <BodyCell className="font-medium">
                      {row.firstName} {row.lastName}
                    </BodyCell>
                    <BodyCell>{row.email}</BodyCell>
                    <BodyCell>
                      <RoleBadge role={row.role} />
                    </BodyCell>
                    <BodyCell>{row.division ?? "—"}</BodyCell>
                    <BodyCell>{row.position ?? "—"}</BodyCell>
                    <BodyCell>
                      <StatusPill isActive={row.isActive} />
                    </BodyCell>
                    <BodyCell>
                      {row.createdAt instanceof Date
                        ? row.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </BodyCell>
                    <BodyCell className="relative">
                      <div ref={menuRef}>
                        <button
                          type="button"
                          onClick={(e) => toggleMenu(row.id, e)}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#3c414b] transition hover:bg-black/5"
                          aria-label={`Open actions for ${row.firstName} ${row.lastName}`}
                          aria-expanded={openMenuId === row.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === row.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[#dfe1ed] bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditUser(row.id);
                              }}
                              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[#5d6780] hover:bg-[#f3f5fa]"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleArchiveUser(row.id);
                              }}
                              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[#5d6780] hover:bg-[#f3f5fa]"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </BodyCell>
                  </tr>
                ))}
                {shouldVirtualizeRows && bottomSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={8} style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
              </>
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-6 text-center text-sm text-[#7d8598]"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-[#dfe1ed] px-4 py-3">
          <p className="text-xs text-[#7b8398]">
            Showing{" "}
            <span className="font-semibold text-[#2f3339]">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-[#2f3339]">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-4">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-md border border-[#dfe1ed] bg-white px-2 py-1.5 text-xs font-medium text-[#5d6780] outline-none focus:border-[#3B9F41]"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[80px] text-center text-xs text-[#5d6780]">
                Page <span className="font-semibold text-[#2f3339]">{pagination.page}</span> of{" "}
                <span className="font-semibold text-[#2f3339]">{pagination.totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] p-1.5 text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser ? (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out ${
              isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />
          {typeof window !== "undefined" &&
            createPortal(
              <div
                ref={drawerRef}
                className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md transform bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
                  isDrawerOpen ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="User details"
                tabIndex={-1}
              >
                <UserDetailDrawer user={selectedUser} onClose={handleCloseDrawer} />
              </div>,
              document.body,
            )}
        </>
      ) : null}

      {isAddUserModalOpen ? (
        <AddUserModal
          lookups={lookups}
          onClose={handleCloseAddUserModal}
          onCreated={handleUserCreated}
        />
      ) : null}
    </div>
  );
}

function DrawerPanelFallback() {
  return (
    <div className="flex h-full flex-col px-6 py-5">
      <div className="h-6 w-40 animate-pulse rounded bg-[#e5e7eb]" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-[#e5e7eb]" />
        <div className="h-4 w-[85%] animate-pulse rounded bg-[#e5e7eb]" />
        <div className="h-4 w-[70%] animate-pulse rounded bg-[#e5e7eb]" />
      </div>
    </div>
  );
}

function HeaderCell({ children }: Readonly<{ children: string }>) {
  return (
    <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <td className={`px-5 py-3.5 align-middle ${className ?? ""}`}>
      {children}
    </td>
  );
}

function RoleBadge({ role }: Readonly<{ role: UserRole }>) {
  const styles =
    role === "admin"
      ? "bg-[#E8D7F7] text-[#7C4DFF]"
      : role === "approver"
        ? "bg-[#D7F7F0] text-[#00A87D]"
        : "bg-[#F3F5FA] text-[#5d6780]";

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

function StatusPill({ isActive }: Readonly<{ isActive: boolean }>) {
  const styles = isActive
    ? "bg-[#B3FBD2] text-[#26AF5D]"
    : "bg-[#FFB1B1] text-[#E35E5E]";

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
