import type { ReactNode } from "react";
import { LiveNotificationBell } from "@/src/components/notifications/live-notification-bell";
import {
  RoleShell,
  type RoleShellNavItem,
  type RoleShellUser,
} from "@/src/components/layouts/role-shell";

type RegularNavItemKey = "dashboard" | "travel-orders" | "ptr-summary" | "settings";

type RegularShellProps = Readonly<{
  title: string;
  activeItem: RegularNavItemKey;
  children: ReactNode;
  headerAction?: ReactNode;
  user?: RoleShellUser;
}>;

const OVERVIEW_ITEMS: readonly RoleShellNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/regular/dashboard",
    icon: "dashboard",
  },
  {
    key: "travel-orders",
    label: "Travel Orders",
    href: "/regular/travel-orders/create-travel-order",
    icon: "travel-orders",
  },
  {
    key: "ptr-summary",
    label: "PTR Summary",
    href: "/regular/ptr-summary",
    icon: "ptr-summary",
  },
];

const TOOL_ITEMS: readonly RoleShellNavItem[] = [
  { key: "settings", label: "Settings", disabled: true, icon: "settings" },
];

export function RegularShell({
  title,
  activeItem,
  children,
  headerAction,
  user,
}: RegularShellProps) {
  return (
    <RoleShell
      title={title}
      activeItem={activeItem}
      user={user}
      headerAction={
        <div className="flex items-center gap-3">
          <LiveNotificationBell role="regular" />
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
