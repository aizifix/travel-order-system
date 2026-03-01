import Link from "next/link";
import {
  DashboardMetricCard,
  type DashboardMetricTone,
} from "@/src/components/admin/dashboard/metric-card";

export type ApproverDashboardMetric = Readonly<{
  label: string;
  value: number;
  tone: DashboardMetricTone;
}>;

export type ApproverRecentTravelOrder = Readonly<{
  id: number;
  orderNo: string;
  requestedBy: string;
  destination: string;
  departureDateLabel: string;
  returnDateLabel: string;
  status: string;
}>;

type ApproverDashboardViewProps = Readonly<{
  fullName: string;
  currentDateTime: string;
  metrics: readonly ApproverDashboardMetric[];
  recentOrders: readonly ApproverRecentTravelOrder[];
}>;

export function ApproverDashboardView({
  fullName,
  currentDateTime,
  metrics,
  recentOrders,
}: ApproverDashboardViewProps) {
  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-[#3B9F41] to-[#F0F0F0] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] sm:p-7">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome Back, {fullName || "Approver"}!
        </h2>
        <p className="mt-2 text-sm text-white/90">{currentDateTime}</p>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Approver dashboard metrics"
      >
        {metrics.map((metric) => (
          <DashboardMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </section>

      <section aria-labelledby="recent-assigned-requests-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="recent-assigned-requests-heading"
              className="text-2xl font-semibold tracking-tight text-[#2f3339]"
            >
              Recent Assigned Requests
            </h2>
            <p className="mt-1 text-xs text-[#7b8398]">
              Step-1 queue overview for your assigned travel orders.
            </p>
          </div>
          <Link
            href="/approver/travel-orders"
            className="inline-flex items-center rounded-lg border border-[#dfe1ed] bg-white px-4 py-2 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
          >
            Open Travel Orders
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#dfe1ed] bg-white">
          <table className="min-w-[780px] w-full border-collapse text-left">
            <thead className="bg-[#f3f5fa] text-[#5d6780]">
              <tr className="border-b border-[#cfd4e2]">
                <HeaderCell>TO no.</HeaderCell>
                <HeaderCell>Requested By</HeaderCell>
                <HeaderCell>Destination</HeaderCell>
                <HeaderCell>Travel Dates</HeaderCell>
                <HeaderCell>Status</HeaderCell>
              </tr>
            </thead>
            <tbody className="text-sm text-[#4a5266]">
              {recentOrders.length > 0 ? (
                recentOrders.map((row) => (
                  <tr key={row.id} className="border-b border-[#dfe1ed] last:border-b-0">
                    <BodyCell className="font-semibold">{row.orderNo}</BodyCell>
                    <BodyCell>{row.requestedBy}</BodyCell>
                    <BodyCell>{row.destination}</BodyCell>
                    <BodyCell>
                      {row.departureDateLabel} - {row.returnDateLabel}
                    </BodyCell>
                    <BodyCell>
                      <StatusPill status={row.status} />
                    </BodyCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-[#7d8598]"
                  >
                    No assigned requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HeaderCell({ children }: Readonly<{ children: string }>) {
  return (
    <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <td className={`px-5 py-3.5 align-middle ${className ?? ""}`}>{children}</td>
  );
}

function StatusPill({ status }: Readonly<{ status: string }>) {
  const normalized = status.toUpperCase();

  const styles =
    normalized === "APPROVED" || normalized === "STEP1_APPROVED"
      ? "bg-[#B3FBD2] text-[#26AF5D]"
      : normalized === "REJECTED" || normalized === "CANCELLED"
        ? "bg-[#FFB1B1] text-[#E35E5E]"
        : normalized === "RETURNED"
          ? "bg-[#FFE7B3] text-[#B57900]"
          : "bg-[#FEF6D2] text-[#C9AF37]";

  const label = normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}
