import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Users2,
  XCircle,
} from "lucide-react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getAllTravelOrdersForAdmin,
  type AdminTravelOrderItem,
} from "@/src/server/travel-orders/service";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ApprovalTurnaroundMapCard } from "@/src/components/admin/dashboard/approval-turnaround-map-card";
import { TravelOrdersOverviewCard } from "@/src/components/admin/dashboard/travel-orders-overview-card";

export const dynamic = "force-dynamic";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

type DashboardSnapshot = Readonly<{
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  returnedRejectedOrders: number;
  currentMonthOrders: number;
  monthlySeries: readonly Readonly<{ label: string; value: number }>[];
  topTravelers: readonly Readonly<{ label: string; value: number }>[];
  topDestinations: readonly Readonly<{ label: string; value: number }>[];
  approvalTurnaround: readonly Readonly<{
    label: string;
    averageDays: number;
    sampleCount: number;
  }>[];
  recentOrders: readonly AdminTravelOrderItem[];
  distribution: readonly Readonly<{ label: string; value: number; color: string }>[];
}>;

const ONE_DAY_MS = 86_400_000;
const MONTH_INDEX_BY_LABEL: Readonly<Record<string, number>> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseLabeledDate(rawValue: string | null | undefined): Date | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  const nativeDate = new Date(trimmed);
  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  const match = trimmed.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i,
  );
  if (!match) {
    return null;
  }

  const [, monthToken, dayToken, yearToken, hourToken, minuteToken, meridiemToken] = match;
  const monthIndex = MONTH_INDEX_BY_LABEL[monthToken.toLowerCase()];
  if (typeof monthIndex !== "number") {
    return null;
  }

  const day = Number(dayToken);
  const year = Number(yearToken);
  if (!Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }

  let hours = 0;
  let minutes = 0;

  if (hourToken && minuteToken && meridiemToken) {
    const parsedHour = Number(hourToken);
    const parsedMinute = Number(minuteToken);
    if (!Number.isInteger(parsedHour) || !Number.isInteger(parsedMinute)) {
      return null;
    }

    const normalizedHour = parsedHour % 12;
    const upperMeridiem = meridiemToken.toUpperCase();
    hours = upperMeridiem === "PM" ? normalizedHour + 12 : normalizedHour;
    minutes = parsedMinute;
  }

  const parsedDate = new Date(year, monthIndex, day, hours, minutes);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function parseOrderDate(order: AdminTravelOrderItem): Date | null {
  if (order.orderDateIso?.trim()) {
    const byIso = new Date(`${order.orderDateIso}T00:00:00Z`);
    if (!Number.isNaN(byIso.getTime())) {
      return byIso;
    }
  }

  if (order.departureDateIso?.trim()) {
    const byDepartureIso = new Date(`${order.departureDateIso}T00:00:00Z`);
    if (!Number.isNaN(byDepartureIso.getTime())) {
      return byDepartureIso;
    }
  }

  const labeledCandidates = [
    order.orderDateLabel,
    order.departureDateLabel,
    order.returnDateLabel,
    order.createdAtLabel,
  ];

  for (const candidate of labeledCandidates) {
    const parsed = parseLabeledDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function toKeyedCounts(
  orders: readonly AdminTravelOrderItem[],
  pick: (order: AdminTravelOrderItem) => string,
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const order of orders) {
    const key = pick(order).trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function topFromMap(
  counts: ReadonlyMap<string, number>,
  limit = 5,
): readonly Readonly<{ label: string; value: number }>[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function buildMonthlySeries(
  orders: readonly AdminTravelOrderItem[],
  months = 10,
): readonly Readonly<{ label: string; value: number }>[] {
  const monthKeys: { key: string; label: string }[] = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push({
      key,
      label: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  const counts = new Map<string, number>();
  for (const order of orders) {
    const date = parseOrderDate(order);
    if (!date) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return monthKeys.map((item) => ({
    label: item.label,
    value: counts.get(item.key) ?? 0,
  }));
}

function normalizeDestinationLabel(rawValue: string): string {
  const firstLine = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine ?? "Unknown destination";
}

function buildApprovalTurnaroundSeries(
  orders: readonly AdminTravelOrderItem[],
): readonly Readonly<{
  label: string;
  averageDays: number;
  sampleCount: number;
}>[] {
  const statsByDestination = new Map<string, { totalDays: number; sampleCount: number }>();

  for (const order of orders) {
    const startDate = parseOrderDate(order);
    const endDate =
      parseLabeledDate(order.step2.actionAtLabel) ??
      parseLabeledDate(order.step1.actionAtLabel);

    if (!startDate || !endDate) {
      continue;
    }

    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / ONE_DAY_MS);
    if (!Number.isFinite(dayDiff) || dayDiff < 0) {
      continue;
    }

    const destinationLabel = normalizeDestinationLabel(order.destination);
    const current = statsByDestination.get(destinationLabel) ?? {
      totalDays: 0,
      sampleCount: 0,
    };

    statsByDestination.set(destinationLabel, {
      totalDays: current.totalDays + Math.max(dayDiff, 1),
      sampleCount: current.sampleCount + 1,
    });
  }

  return [...statsByDestination.entries()]
    .map(([label, stats]) => ({
      label,
      averageDays: Number((stats.totalDays / stats.sampleCount).toFixed(1)),
      sampleCount: stats.sampleCount,
    }))
    .sort(
      (left, right) =>
        right.averageDays - left.averageDays ||
        right.sampleCount - left.sampleCount ||
        left.label.localeCompare(right.label),
    )
    .slice(0, 6);
}

function buildSnapshot(orders: readonly AdminTravelOrderItem[]): DashboardSnapshot {
  let pendingOrders = 0;
  let approvedOrders = 0;
  let returnedRejectedOrders = 0;
  let otherOrders = 0;

  for (const order of orders) {
    const status = order.status.toUpperCase();

    if (status === "PENDING" || status === "STEP1_APPROVED") {
      pendingOrders += 1;
      continue;
    }

    if (status === "APPROVED") {
      approvedOrders += 1;
      continue;
    }

    if (status === "RETURNED" || status === "REJECTED" || status === "CANCELLED") {
      returnedRejectedOrders += 1;
      continue;
    }

    otherOrders += 1;
  }

  const monthlySeries = buildMonthlySeries(orders, 10);
  const topTravelers = topFromMap(toKeyedCounts(orders, (order) => order.requestedBy), 5);
  const topDestinations = topFromMap(toKeyedCounts(orders, (order) => order.destination), 5);
  const approvalTurnaround = buildApprovalTurnaroundSeries(orders);

  const distribution = [
    { label: "Approved", value: approvedOrders, color: "#85d9a9" },
    { label: "Pending", value: pendingOrders, color: "#f3cc61" },
    { label: "Returned / Rejected", value: returnedRejectedOrders, color: "#ef8a8a" },
    { label: "Draft / Other", value: otherOrders, color: "#d8deea" },
  ] as const;

  return {
    totalOrders: orders.length,
    pendingOrders,
    approvedOrders,
    returnedRejectedOrders,
    currentMonthOrders: monthlySeries[monthlySeries.length - 1]?.value ?? 0,
    monthlySeries,
    topTravelers,
    topDestinations,
    approvalTurnaround,
    recentOrders: orders.slice(0, 6),
    distribution,
  };
}

function shareText(part: number, total: number): string {
  if (total <= 0) {
    return "0% of total";
  }

  const percentage = Math.round((part / total) * 100);
  return `${percentage}% of total`;
}

function summarizeBudget(totalOrders: number, approvedOrders: number): Readonly<{
  allocated: number;
  used: number;
  remaining: number;
  usedPercent: number;
}> {
  const allocated = 1_200_000;
  const used = Math.min(allocated, totalOrders * 20_000 + approvedOrders * 6_000);
  const remaining = Math.max(allocated - used, 0);
  const usedPercent = allocated > 0 ? Math.round((used / allocated) * 100) : 0;

  return { allocated, used, remaining, usedPercent };
}

function donutGradient(distribution: DashboardSnapshot["distribution"]): CSSProperties {
  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return { background: "conic-gradient(#d8deea 0deg 360deg)" };
  }

  let cursor = 0;
  const stops = distribution.map((item) => {
    const start = cursor;
    const sweep = (item.value / total) * 360;
    cursor += sweep;
    return `${item.color} ${start.toFixed(2)}deg ${cursor.toFixed(2)}deg`;
  });

  return { background: `conic-gradient(${stops.join(", ")})` };
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function getStatusPillClasses(status: string): string {
  const normalized = status.toUpperCase();

  if (normalized === "APPROVED" || normalized === "STEP1_APPROVED") {
    return "bg-[#B3FBD2] text-[#26AF5D]";
  }

  if (normalized === "REJECTED" || normalized === "CANCELLED") {
    return "bg-[#FFB1B1] text-[#E35E5E]";
  }

  if (normalized === "RETURNED") {
    return "bg-[#FFE7B3] text-[#B57900]";
  }

  return "bg-[#FEF6D2] text-[#C9AF37]";
}

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");

  const [userData, orders] = await Promise.all([
    getUserWithDivision(session.userId),
    getAllTravelOrdersForAdmin(100),
  ]);

  const snapshot = buildSnapshot(orders);
  const budget = summarizeBudget(snapshot.totalOrders, snapshot.approvedOrders);
  const now = new Date();
  const year = now.getFullYear();
  const welcomeDateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const welcomeTimeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const topTravelers =
    snapshot.topTravelers.length > 0
      ? snapshot.topTravelers
      : [{ label: "No data yet", value: 0 }];

  const topDestinations =
    snapshot.topDestinations.length > 0
      ? snapshot.topDestinations
      : [
          { label: "Cagayan de Oro", value: 0 },
          { label: "Iligan City", value: 0 },
          { label: "Misamis Oriental", value: 0 },
          { label: "Zamboanga City", value: 0 },
          { label: "Bukidnon", value: 0 },
        ];

  const maxMonthlyValue = Math.max(
    1,
    ...snapshot.monthlySeries.map((point) => point.value),
  );
  const maxDestinationValue = Math.max(
    1,
    ...topDestinations.map((item) => item.value),
  );

  const distributionTotal = snapshot.distribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const approvedShare =
    distributionTotal > 0
      ? Math.round((snapshot.approvedOrders / distributionTotal) * 100)
      : 0;

  return (
    <AdminShell
      title="Dashboard"
      activeItem="dashboard"
      headerAction={
        <Link
          href="/admin/travel-orders/create-travel-order"
          className="inline-flex items-center rounded-lg bg-[#3B9F41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#359436]"
        >
          + Create Travel Order
        </Link>
      }
      user={
        userData
          ? {
              name: `${userData.firstName} ${userData.lastName}`.trim(),
              role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
              division: userData.division ?? "No Division Assigned",
            }
          : undefined
      }
    >
      <div className="space-y-4 lg:space-y-5">
        <section className="rounded-2xl bg-gradient-to-r from-[#3B9F41] via-[#65b66a] to-[#cde8d2] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Welcome Back, {userData?.firstName ?? "Admin"}!
              </h2>
              <p className="mt-1.5 text-sm text-white/90">
                {welcomeDateLabel} | {welcomeTimeLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterChip label={String(year)} />
              <FilterChip label="All Statuses" />
              <FilterChip label="All Destinations" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Orders"
            value={snapshot.totalOrders}
            caption={`+${snapshot.currentMonthOrders} this month`}
            tone="warning"
            icon={<FileText className="h-6 w-6" aria-hidden="true" />}
          />
          <MetricCard
            label="Pending Approval"
            value={snapshot.pendingOrders}
            caption={shareText(snapshot.pendingOrders, snapshot.totalOrders)}
            tone="warning"
            icon={<Clock3 className="h-6 w-6" aria-hidden="true" />}
          />
          <MetricCard
            label="Approved"
            value={snapshot.approvedOrders}
            caption={shareText(snapshot.approvedOrders, snapshot.totalOrders)}
            tone="success"
            icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
          />
          <MetricCard
            label="Returned / Rejected"
            value={snapshot.returnedRejectedOrders}
            caption={shareText(snapshot.returnedRejectedOrders, snapshot.totalOrders)}
            tone="danger"
            icon={<XCircle className="h-6 w-6" aria-hidden="true" />}
          />
        </section>

        <section className="grid items-stretch gap-4 xl:grid-cols-12">
          <TravelOrdersOverviewCard
            monthlySeries={snapshot.monthlySeries}
            totalOrders={snapshot.totalOrders}
            year={year}
          />

          <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4 xl:col-span-3">
            <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
              Status Distribution
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-[#26AF5D]">
              +{approvedShare}% approved
            </p>

            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-44 w-44 shrink-0">
                <div
                  className="h-full w-full rounded-full"
                  style={donutGradient(snapshot.distribution)}
                  aria-hidden="true"
                />
                <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-bold text-[#2f3339]">{approvedShare}%</span>
                  <span className="text-xs font-medium text-[#7d8598]">Approved</span>
                </div>
              </div>

              <ul className="mt-4 w-full space-y-2.5 text-sm text-[#4a5266]">
                {snapshot.distribution.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-xs text-[#7d8598]">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <ApprovalTurnaroundMapCard destinations={snapshot.topDestinations} />
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-3">
            <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
                  Budget Utilization
                </h3>
                <span className="text-sm font-semibold text-[#5d6780]">
                  {CURRENCY_FORMATTER.format(budget.allocated)}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                <BudgetRow
                  label="Used"
                  amount={budget.used}
                  percent={budget.usedPercent}
                  tone="warning"
                />
                <BudgetRow
                  label="Remaining"
                  amount={budget.remaining}
                  percent={Math.max(100 - budget.usedPercent, 0)}
                  tone="success"
                />
              </div>

              <div className="mt-4 flex items-end gap-1.5">
                {snapshot.monthlySeries.map((point, index) => {
                  const height = Math.max(
                    6,
                    Math.round((point.value / maxMonthlyValue) * 50) +
                      (index % 3 === 0 ? 6 : 0),
                  );

                  return (
                    <div
                      key={`budget-mini-${point.label}`}
                      className="flex-1 rounded bg-[#d3ecd9]"
                      style={{ height: `${height}px` }}
                      title={`${point.label}: ${point.value}`}
                    />
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
                  Top Travel Orders
                </h3>
                <Users2 className="h-5 w-5 text-[#7d8598]" aria-hidden="true" />
              </div>

              <div className="mt-3 space-y-3">
                {topDestinations.slice(0, 4).map((item) => {
                  const width = Math.max(
                    8,
                    Math.round((item.value / maxDestinationValue) * 100),
                  );

                  return (
                    <div key={`top-order-${item.label}`}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-[#4a5266]">
                        <span className="truncate">{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#edf0f6]">
                        <div
                          className="h-full rounded-full bg-[#79d1a1]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4 xl:col-span-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
                  My Recent Travel Orders
                </h3>
                <p className="text-xs text-[#7b8398]">
                  Latest submissions from all requesters.
                </p>
              </div>

              <Link
                href="/admin/travel-orders"
                className="inline-flex items-center rounded-lg border border-[#dfe1ed] bg-white px-4 py-2 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Open Travel Orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left">
                <thead className="bg-[#f3f5fa] text-[#5d6780]">
                  <tr className="border-y border-[#dfe1ed]">
                    <TableHeadCell>TO No.</TableHeadCell>
                    <TableHeadCell>Destination</TableHeadCell>
                    <TableHeadCell>Travel Dates</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                  </tr>
                </thead>

                <tbody className="text-sm text-[#4a5266]">
                  {snapshot.recentOrders.length > 0 ? (
                    snapshot.recentOrders.map((row) => (
                      <tr key={row.id} className="border-b border-[#dfe1ed] last:border-b-0">
                        <TableBodyCell className="font-semibold">{row.orderNo}</TableBodyCell>
                        <TableBodyCell>
                          <span className="block max-w-[220px] truncate" title={row.destination}>
                            {row.destination}
                          </span>
                        </TableBodyCell>
                        <TableBodyCell className="whitespace-nowrap">
                          {row.departureDateLabel} - {row.returnDateLabel}
                        </TableBodyCell>
                        <TableBodyCell>
                          <span
                            className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusPillClasses(
                              row.status,
                            )}`}
                          >
                            {formatStatusLabel(row.status)}
                          </span>
                        </TableBodyCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-[#7d8598]"
                      >
                        No travel orders available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4 xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
                Top Travelers
              </h3>

              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-[#dfe1ed] bg-[#f9fafc] px-2.5 py-1 text-xs font-semibold text-[#5d6780]">
                  Approval
                </span>
                <Link
                  href="/admin/travel-orders"
                  className="text-xs font-semibold text-[#5d6780] transition hover:text-[#3B9F41]"
                >
                  View All
                </Link>
              </div>
            </div>

            <div className="mt-3 divide-y divide-[#edf0f6] text-sm">
              {topTravelers.map((item, index) => (
                <div
                  key={`traveler-${item.label}`}
                  className="flex items-center justify-between py-2.5 text-[#4a5266]"
                >
                  <span className="truncate pr-4 font-medium">
                    {index + 1}. {item.label}
                  </span>
                  <span className="text-lg font-semibold text-[#2f3339]">{item.value}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}

function FilterChip({ label }: Readonly<{ label: string }>) {
  return (
    <button
      type="button"
      className="inline-flex cursor-default items-center gap-1 rounded-lg border border-white/55 bg-white/88 px-3 py-1.5 text-xs font-semibold text-[#4a5266]"
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

type MetricTone = "warning" | "success" | "danger";

function MetricCard({
  label,
  value,
  caption,
  tone,
  icon,
}: Readonly<{
  label: string;
  value: number;
  caption: string;
  tone: MetricTone;
  icon: ReactNode;
}>) {
  const toneClasses =
    tone === "success"
      ? "bg-[#B3FBD2] text-[#18A453]"
      : tone === "danger"
        ? "bg-[#FFB1B1] text-[#FF2B2B]"
        : "bg-[#FEF6D2] text-[#F2C312]";

  return (
    <article className="rounded-2xl border border-[#dfe1ed] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#7b8398]">{label}</p>
          <p className="mt-1.5 text-[34px] font-semibold leading-none tracking-tight text-[#2f3339]">
            {NUMBER_FORMATTER.format(value)}
          </p>
          <p className="mt-2 text-xs font-medium text-[#26AF5D]">{caption}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function BudgetRow({
  label,
  amount,
  percent,
  tone,
}: Readonly<{
  label: string;
  amount: number;
  percent: number;
  tone: "warning" | "success";
}>) {
  const barClass = tone === "warning" ? "bg-[#ebc95c]" : "bg-[#5eb591]";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-[#4a5266]">
        <span>{label}</span>
        <span>{CURRENCY_FORMATTER.format(amount)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#edf0f6]">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
        />
      </div>
    </div>
  );
}

function TableHeadCell({ children }: Readonly<{ children: string }>) {
  return (
    <th className="px-4 py-3 text-xs font-semibold tracking-tight whitespace-nowrap">
      {children}
    </th>
  );
}

function TableBodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
