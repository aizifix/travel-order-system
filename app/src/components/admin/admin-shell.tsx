import type { ReactNode } from "react";
import { LiveNotificationBell } from "@/src/components/notifications/live-notification-bell";
import {
  RoleShell,
  type RoleShellNavItem,
  type RoleShellUser,
} from "@/src/components/layouts/role-shell";

type AdminNavItemKey =
  | "dashboard"
  | "travel-orders"
  | "ptr-summary"
  | "users"
  | "logs"
  | "settings";

type AdminShellProps = Readonly<{
  title: string;
  activeItem: AdminNavItemKey;
  children: ReactNode;
  headerAction?: ReactNode;
  user?: RoleShellUser;
}>;

const OVERVIEW_ITEMS: readonly RoleShellNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "dashboard",
  },
  {
    key: "travel-orders",
    label: "Travel Orders Table",
    href: "/admin/travel-orders",
    icon: "travel-orders",
  },
  {
    key: "ptr-summary",
    label: "PTR Summary",
    href: "/admin/ptr-summary",
    icon: "ptr-summary",
  },
  { key: "users", label: "Users", href: "/admin/users", icon: "users" },
  { key: "logs", label: "Logs", disabled: true, icon: "logs" },
];

const TOOL_ITEMS: readonly RoleShellNavItem[] = [
  { key: "settings", label: "Settings", disabled: true, icon: "settings" },
];

export function AdminShell({
  title,
  activeItem,
  children,
  headerAction,
  user,
}: AdminShellProps) {
  return (
    <RoleShell
      title={title}
      activeItem={activeItem}
      user={user}
      headerAction={
        <div className="flex items-center gap-3">
          <LiveNotificationBell role="admin" />
          {headerAction}
        </div>
      }
      overviewItems={OVERVIEW_ITEMS}
      toolItems={TOOL_ITEMS}
    >
      {children}
    </RoleShell>
  );
}
export { NotificationBellButton } from "@/src/components/admin/notification-bell-button";
