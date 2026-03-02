"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Archive, MoreHorizontal, X, Mail, Calendar, Shield, Building2, Briefcase, Clock, User2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/src/components/ui/toast-provider";
import type { UserRole } from "@/src/server/auth/types";

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
}>;

export function UsersTable({ rows, pagination }: UsersTableProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleRowClick = useCallback((user: UserTableRow) => {
    setSelectedUser(user);
    // Small delay to ensure animation plays
    requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // Clear selected user after animation completes
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
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", e.target.value);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const showingStart = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
  const showingEnd = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : rows.length;

  return (
    <div className="space-y-4">
<div className="rounded-2xl border border-[#dfe1ed] bg-white">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-hide w-full">
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
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#dfe1ed] cursor-pointer transition-colors hover:bg-[#f8f9fc] last:border-b-0"
                    onClick={() => handleRowClick(row)}
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3c414b] transition hover:bg-black/5"
                          aria-label={`Open actions for ${row.firstName} ${row.lastName}`}
                          aria-expanded={openMenuId === row.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === row.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[#dfe1ed] bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleEditUser(row.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#5d6780] hover:bg-[#f3f5fa]"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveUser(row.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#5d6780] hover:bg-[#f3f5fa]"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    </BodyCell>
                  </tr>
                ))
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
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#dfe1ed] px-5 py-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-[#5d6780]">
              <span>Showing</span>
              <span className="font-medium">{showingStart}</span>
              <span>to</span>
              <span className="font-medium">{showingEnd}</span>
              <span>of</span>
              <span className="font-medium">{pagination.total}</span>
              <span>entries</span>
              <select
                value={pagination.limit}
                onChange={handleLimitChange}
                className="ml-2 rounded border border-[#dfe1ed] px-2 py-1 text-xs focus:border-[#3B9F41] focus:outline-none"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#dfe1ed] text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous page"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const total = pagination.totalPages;
                  if (total <= 5) return true;
                  if (page === 1 || page === total) return true;
                  if (Math.abs(page - pagination.page) <= 1) return true;
                  return false;
                })
                .map((page, index, arr) => {
                  const showEllipsis =
                    index > 0 && page - arr[index - 1] > 1;
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-[#9ca7bd]">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded border text-sm font-medium transition ${
                          page === pagination.page
                            ? "border-[#3B9F41] bg-[#3B9F41] text-white"
                            : "border-[#dfe1ed] text-[#5d6780] hover:bg-[#f3f5fa]"
                        }`}
                        aria-label={`Page ${page}`}
                        aria-current={page === pagination.page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#dfe1ed] text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next page"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      {typeof window !== "undefined" && selectedUser &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out ${
                isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              onClick={isDrawerOpen ? handleCloseDrawer : undefined}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div
              ref={drawerRef}
              className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md transform bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
                isDrawerOpen ? "translate-x-0" : "translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="User details"
            >
              <UserDetailDrawer user={selectedUser} onClose={handleCloseDrawer} />
            </div>
          </>,
          document.body
        )}
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
    <td className={`px-5 py-3.5 align-middle whitespace-nowrap ${className ?? ""}`}>
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

function UserDetailDrawer({
  user,
  onClose,
}: Readonly<{ user: UserTableRow; onClose: () => void }>) {
  return (
    <div className="flex h-full flex-col m-0">
      {/* Header */}
      <div className="flex-none flex items-center justify-between border-b border-[#dfe1ed] px-6 py-4">
        <h2 className="text-lg font-semibold text-[#1a1d1f]">User Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 mt-4 mb-4">
        {/* Profile Section */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3B9F41] text-xl font-semibold text-white">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#1a1d1f]">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-[#5d6780]">{user.email}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <StatusPill isActive={user.isActive} />
        </div>

        {/* Information Sections */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Contact Information
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={User2} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            </div>
          </div>

          {/* Role & Permissions */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Role & Permissions
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Shield} label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Work Information
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Building2} label="Division" value={user.division ?? "—"} />
              <InfoRow icon={Briefcase} label="Position" value={user.position ?? "—"} />
              <InfoRow icon={User2} label="Designation" value={user.designation ?? "—"} />
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Account Information
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow
                icon={Calendar}
                label="Created At"
                value={
                  user.createdAt instanceof Date
                    ? user.createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <InfoRow icon={Clock} label="User ID" value={`#${user.id}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-none border-t border-[#dfe1ed] px-6 py-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.href = `/admin/users/${user.id}/edit`;
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#dfe1ed] bg-white px-4 py-2.5 text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa]"
          >
            <Pencil className="h-4 w-4" />
            Edit User
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436]"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string }>) {
  return (
    <div className="flex items-center gap-4 border-b border-[#dfe1ed] px-4 py-3 last:border-b-0">
      <Icon className="h-5 w-5 text-[#9ca7bd]" />
      <div className="flex-1">
        <p className="text-xs text-[#9ca7bd]">{label}</p>
        <p className="text-sm font-medium text-[#1a1d1f]">{value}</p>
      </div>
    </div>
  );
}
