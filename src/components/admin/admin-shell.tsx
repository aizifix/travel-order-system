import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  FileText,
  LayoutGrid,
  List,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

type AdminNavItemKey =
  | "dashboard"
  | "travel-orders"
  | "ptr-summary"
  | "users"
  | "logs"
  | "settings";

type AdminNavItem = Readonly<{
  key: AdminNavItemKey;
  label: string;
  href?: string;
  disabled?: boolean;
}>;

type AdminShellProps = Readonly<{
  title: string;
  activeItem: AdminNavItemKey;
  children: ReactNode;
  headerAction?: ReactNode;
}>;

const OVERVIEW_ITEMS: readonly AdminNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "travel-orders", label: "Travel Order", disabled: true },
  { key: "ptr-summary", label: "PT Summary", disabled: true },
  { key: "users", label: "Users", disabled: true },
  { key: "logs", label: "Logs", disabled: true },
];

const TOOL_ITEMS: readonly AdminNavItem[] = [
  { key: "settings", label: "Settings", disabled: true },
];

export function AdminShell({
  title,
  activeItem,
  children,
  headerAction,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-[#2f3339]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full shrink-0 bg-[#78AA37] text-white lg:h-screen lg:w-[250px]">
          <div className="flex h-full flex-col px-4 py-4">
            <div className="flex items-center gap-3 px-1">
              <Image
                src="/da_logo.png"
                alt="Travel Order logo"
                width={50   }
                height={50  }
                className="h-20 w-20 object-cover"
                priority
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">
                  Travel Order
                </p>
                <p className="truncate text-[10px] font-medium text-white/85">
                  DA - Region 10
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/20" />

            <SidebarSection label="Overview" className="mt-6">
              {OVERVIEW_ITEMS.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  active={item.key === activeItem}
                />
              ))}
            </SidebarSection>

            <div className="flex-1" />

            <SidebarSection label="Tools" className="mt-6">
              {TOOL_ITEMS.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  active={item.key === activeItem}
                />
              ))}

              <form action="/api/auth/logout" method="post" className="mt-2">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              </form>
            </SidebarSection>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <main className="px-4 pb-8 pt-4 sm:px-8 lg:px-10 lg:pb-10 lg:pt-5">
            <div className="mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

type SidebarSectionProps = Readonly<{
  label: string;
  className?: string;
  children: ReactNode;
}>;

function SidebarSection({ label, className, children }: SidebarSectionProps) {
  return (
    <section className={className}>
      <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">
        {label}
      </p>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

function SidebarNavItem({
  item,
  active,
}: Readonly<{
  item: AdminNavItem;
  active: boolean;
}>) {
  const classes = [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition",
    active
      ? "bg-white/24 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      : "text-white/95 hover:bg-white/10",
    item.disabled && !active ? "cursor-not-allowed opacity-90" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const icon = <SidebarIcon itemKey={item.key} active={active} />;

  if (!item.href || item.disabled) {
    return (
      <span aria-disabled="true" className={classes}>
        {icon}
        <span>{item.label}</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={classes}>
      {icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function NotificationBellButton({
  count = 3,
}: Readonly<{ count?: number }>) {
  return (
    <button
      type="button"
      className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#343a40] transition hover:bg-black/5"
      aria-label="Notifications"
    >
      <Bell className="h-7 w-7" aria-hidden="true" />
      <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#3BE884] px-1 text-[9px] font-semibold leading-none text-white">
        {count}
      </span>
    </button>
  );
}

function SidebarIcon({
  itemKey,
  active,
}: Readonly<{ itemKey: AdminNavItemKey; active: boolean }>) {
  const className = `h-5 w-5 ${active ? "text-white" : "text-white/95"}`;

  switch (itemKey) {
    case "dashboard":
      return <LayoutGrid className={className} aria-hidden="true" />;
    case "travel-orders":
      return <BookOpen className={className} aria-hidden="true" />;
    case "ptr-summary":
      return <FileText className={className} aria-hidden="true" />;
    case "users":
      return <Users className={className} aria-hidden="true" />;
    case "logs":
      return <List className={className} aria-hidden="true" />;
    case "settings":
      return <Settings className={className} aria-hidden="true" />;
    default:
      return <LayoutGrid className={className} aria-hidden="true" />;
  }
}
