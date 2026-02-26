import Image from "next/image";
import Link from "next/link";
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
        <aside className="w-full shrink-0 bg-[#51A990] text-white lg:h-screen lg:w-[200px]">
          <div className="flex h-full flex-col px-4 py-4">
            <div className="flex items-center gap-3 px-1">
              <Image
                src="/da_logo.png"
                alt="Travel Order logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-white/80 object-cover"
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
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition hover:bg-white/10"
                >
                  <LogOutIcon />
                  <span>Log Out</span>
                </button>
              </form>
            </SidebarSection>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="px-4 pt-5 sm:px-8 lg:px-10 lg:pt-7">
            <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight text-[#30343a] sm:text-[2rem]">
                {title}
              </h1>
              {headerAction ?? <NotificationBellButton />}
            </div>
          </header>

          <main className="px-4 pb-8 pt-4 sm:px-8 lg:px-10 lg:pb-10 lg:pt-5">
            <div className="mx-auto w-full max-w-[980px]">{children}</div>
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
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-[#343a40] transition hover:bg-black/5"
      aria-label="Notifications"
    >
      <BellIcon />
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
  const className = active ? "text-white" : "text-white/95";

  switch (itemKey) {
    case "dashboard":
      return <DashboardGridIcon className={className} />;
    case "travel-orders":
      return <BookIcon className={className} />;
    case "ptr-summary":
      return <DocumentIcon className={className} />;
    case "users":
      return <UsersIcon className={className} />;
    case "logs":
      return <ListIcon className={className} />;
    case "settings":
      return <GearIcon className={className} />;
    default:
      return <DashboardGridIcon className={className} />;
  }
}

type IconProps = Readonly<{ className?: string }>;

function DashboardGridIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21V4.5Z" />
      <path d="M5 5h10" />
      <path d="M9 2v17" />
    </svg>
  );
}

function DocumentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-1.5A3.5 3.5 0 0 0 12.5 16h-4A3.5 3.5 0 0 0 5 19.5V21" />
      <circle cx="10.5" cy="9" r="3" />
      <path d="M19 21v-1a3 3 0 0 0-2.3-2.92" />
      <path d="M15.5 4.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}

function ListIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GearIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 2.9a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 0 1 .25l1-.28a1 1 0 0 1 1.2.7l.26 1a1 1 0 0 0 .76.73l1 .24a1 1 0 0 1 .73 1.2l-.27 1a1 1 0 0 0 .24.98l.7.75a1 1 0 0 1 0 1.39l-.7.75a1 1 0 0 0-.24.98l.27 1a1 1 0 0 1-.73 1.2l-1 .24a1 1 0 0 0-.76.73l-.26 1a1 1 0 0 1-1.2.7l-1-.28a1 1 0 0 0-1 .25l-.7.7a1 1 0 0 1-1.4 0l-.7-.7a1 1 0 0 0-1-.25l-1 .28a1 1 0 0 1-1.2-.7l-.26-1a1 1 0 0 0-.76-.73l-1-.24a1 1 0 0 1-.73-1.2l.27-1a1 1 0 0 0-.24-.98l-.7-.75a1 1 0 0 1 0-1.39l.7-.75a1 1 0 0 0 .24-.98l-.27-1a1 1 0 0 1 .73-1.2l1-.24a1 1 0 0 0 .76-.73l.26-1a1 1 0 0 1 1.2-.7l1 .28a1 1 0 0 0 1-.25l.7-.7Z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
      <path d="M11 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 9a5.5 5.5 0 1 1 11 0c0 5 2 6 2 6h-15s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
