import type { ReactNode } from "react";
import { LiveNotificationBell } from "@/src/components/notifications/live-notification-bell";
import {
  RoleShell,
  type RoleShellNavItem,
  type RoleShellUser,
} from "@/src/components/layouts/role-shell";

type ApproverNavItemKey = "dashboard" | "travel-orders" | "settings";

type ApproverShellProps = Readonly<{
  title: string;
  activeItem: ApproverNavItemKey;
  children: ReactNode;
  headerAction?: ReactNode;
  user?: RoleShellUser;
}>;

const OVERVIEW_ITEMS: readonly RoleShellNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/approver/dashboard",
    icon: "dashboard",
  },
  {
    key: "travel-orders",
    label: "Travel Orders",
    href: "/approver/travel-orders",
    icon: "travel-orders",
  },
];

const TOOL_ITEMS: readonly RoleShellNavItem[] = [
  { key: "settings", label: "Settings", disabled: true, icon: "settings" },
];

export function ApproverShell({
  title,
  activeItem,
  children,
  headerAction,
  user,
}: ApproverShellProps) {
  return (
    <RoleShell
      title={title}
      activeItem={activeItem}
      user={user}
      headerAction={headerAction ?? <LiveNotificationBell role="approver" />}
      overviewItems={OVERVIEW_ITEMS}
      toolItems={TOOL_ITEMS}
    >
      {children}
    </RoleShell>
  );
}
