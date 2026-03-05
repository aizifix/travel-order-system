"use client";

import { Pencil, X, Mail, Calendar, Shield, Building2, Briefcase, Clock, User2 } from "lucide-react";
import type { UserTableRow } from "@/src/components/admin/users/users-table";

export function UserDetailDrawer({
  user,
  onClose,
}: Readonly<{ user: UserTableRow; onClose: () => void }>) {
  return (
    <div className="flex h-full flex-col m-0">
      <div className="flex-none flex items-center justify-between border-b border-[#dfe1ed] px-6 py-4">
        <h2 className="text-lg font-semibold text-[#1a1d1f]">User Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 mt-4 mb-4">
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

        <div className="mb-6">
          <StatusPill isActive={user.isActive} />
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Contact Information
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={User2} label="Full Name" value={`${user.firstName} ${user.lastName}`} />
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Role & Permissions
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Shield} label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5d6780]">
              Work Information
            </h4>
            <div className="rounded-xl border border-[#dfe1ed] bg-white">
              <InfoRow icon={Building2} label="Division" value={user.division ?? "-"} />
              <InfoRow icon={Briefcase} label="Position" value={user.position ?? "-"} />
              <InfoRow icon={User2} label="Designation" value={user.designation ?? "-"} />
            </div>
          </div>

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
                    : "-"
                }
              />
              <InfoRow icon={Clock} label="User ID" value={`#${user.id}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-[#dfe1ed] px-6 py-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.href = `/admin/users/${user.id}/edit`;
            }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#dfe1ed] bg-white px-4 py-2.5 text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa]"
          >
            <Pencil className="h-4 w-4" />
            Edit User
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436]"
          >
            View Full Profile
          </button>
        </div>
      </div>
    </div>
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
