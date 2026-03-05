import type { ReactNode } from "react";
import { LiveNotificationBell } from "@/src/components/notifications/live-notification-bell";
import {
  RoleShell,
  type RoleShellNavItem,
  type RoleShellUser,
} from "@/src/components/layouts/role-shell";

type ApproverNavItemKey = "dashboard" | "travel-orders" | "ptr-summary" | "settings";

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
  {
    key: "ptr-summary",
    label: "PTR Summary",
    href: "/approver/ptr-summary",
    icon: "ptr-summary",
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
      headerAction={
        <div className="flex items-center gap-3">
          <LiveNotificationBell role="approver" />
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
