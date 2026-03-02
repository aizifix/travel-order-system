import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  LayoutGrid,
  List,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

export type RoleShellIconKey =
  | "dashboard"
  | "travel-orders"
  | "ptr-summary"
  | "users"
  | "logs"
  | "settings";

export type RoleShellNavItem = Readonly<{
  key: string;
  label: string;
  icon: RoleShellIconKey;
  href?: string;
  disabled?: boolean;
}>;

export type RoleShellUser = Readonly<{
  name: string;
  role: string;
  division: string;
}>;

type RoleShellProps = Readonly<{
  title: string;
  activeItem: string;
  children: ReactNode;
  headerAction?: ReactNode;
  user?: RoleShellUser;
  overviewItems: readonly RoleShellNavItem[];
  toolItems?: readonly RoleShellNavItem[];
  brandTitle?: string;
  brandSubtitle?: string;
}>;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function RoleShell({
  title,
  activeItem,
  children,
  headerAction,
  user,
  overviewItems,
  toolItems = [],
  brandTitle = "Travel Order",
  brandSubtitle = "DA - Region 10",
}: RoleShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-[#2f3339]">
      <div className="flex flex-col lg:flex-row">
        <aside className="sticky top-0 z-10 h-auto w-full shrink-0 bg-[#3B9F41] text-white lg:h-screen lg:w-[250px]">
          <div className="flex h-full flex-col px-4 py-4">
            <div className="flex items-center gap-1 px-1">
              <Image
                src="/da_logo.png"
                alt="Travel Order logo"
                width={50}
                height={50}
                className="h-20 w-20 object-cover"
                priority
              />
              <div className="min-w-0">
                <p className="truncate text-[18px] font-semibold leading-tight">
                  {brandTitle}
                </p>
                <p className="truncate text-[14px] font-medium text-white/85">
                  {brandSubtitle}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/20" />

            <SidebarSection label="Overview" className="mt-6">
              {overviewItems.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  active={item.key === activeItem}
                />
              ))}
            </SidebarSection>

            <div className="flex-1" />

            {toolItems.length > 0 ? (
              <SidebarSection label="Tools" className="mt-6">
                {toolItems.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    active={item.key === activeItem}
                  />
                ))}
              </SidebarSection>
            ) : null}

            <form action="/api/auth/logout" method="post" className="mt-2">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/95 transition hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </form>

            {user ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#3B9F41]">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] font-medium text-white/80">
                    {user.role}
                  </p>
                  <p className="truncate text-[10px] text-white/60">
                    {user.division}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col">
          <header className="px-4 pt-5 sm:px-8 lg:px-10 lg:pt-7">
            <div className="mx-auto flex w-full items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight text-[#30343a] sm:text-[2rem]">
                {title}
              </h1>
              {headerAction}
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 pb-8 pt-4 sm:px-8 lg:px-10 lg:pb-10 lg:pt-5">
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
  item: RoleShellNavItem;
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

  const icon = <SidebarIcon icon={item.icon} active={active} />;

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

function SidebarIcon({
  icon,
  active,
}: Readonly<{ icon: RoleShellIconKey; active: boolean }>) {
  const className = `h-5 w-5 ${active ? "text-white" : "text-white/95"}`;

  switch (icon) {
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
