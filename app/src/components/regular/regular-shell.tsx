import type { ReactNode } from "react";
import { NotificationBellButton } from "@/src/components/admin/notification-bell-button";
import {
  RoleShell,
  type RoleShellNavItem,
  type RoleShellUser,
} from "@/src/components/layouts/role-shell";

type RegularNavItemKey = "dashboard" | "travel-orders" | "settings";

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
    href: "/regular/travel-orders",
    icon: "travel-orders",
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
      headerAction={headerAction ?? <NotificationBellButton />}
      overviewItems={OVERVIEW_ITEMS}
      toolItems={TOOL_ITEMS}
    >
      {children}
    </RoleShell>
  );
}
