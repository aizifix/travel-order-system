"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import type { UserCreationLookups } from "@/src/components/admin/users/add-user-modal";
import type { UserRole } from "@/src/server/auth/types";

import { ModalSkeleton } from "@/src/components/ui/skeleton";

// Lazy load the heavy AddUserModal component
const AddUserModal = dynamic(
  () => import("@/src/components/admin/users/add-user-modal").then((mod) => ({ default: mod.AddUserModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

type UsersFiltersProps = Readonly<{
  currentSearch: string;
  currentRole: UserRole | "all";
  currentIsActive: boolean | "all";
  lookups: UserCreationLookups;
}>;

export function UsersFilters({
  currentSearch,
  currentRole,
  currentIsActive,
  lookups,
}: UsersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("search", search);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateFilters("search", search);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters("role", e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters("isActive", e.target.value);
  };

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

  useEffect(() => {
    if (isAddUserModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddUserModalOpen]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-4 pl-10 text-sm text-[#2f3339] placeholder-[#9ca7bd] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca7bd]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button
              type="submit"
              className="hidden rounded-lg bg-[#3B9F41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#359436] sm:inline-flex"
            >
              Search
            </button>
          </form>

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
        </div>

        <button
          type="button"
          onClick={handleAddUser}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436] sm:self-auto"
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

      {isAddUserModalOpen ? (
        <AddUserModal
          lookups={lookups}
          onClose={handleCloseAddUserModal}
          onCreated={handleUserCreated}
        />
      ) : null}
    </>
  );
}
