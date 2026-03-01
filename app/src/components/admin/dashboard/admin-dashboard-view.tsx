import { DashboardMetricCard, type DashboardMetricTone } from "./metric-card";
import {
  RecentTravelOrdersTable,
  type RecentTravelOrderRow,
} from "./recent-orders-table";

export type AdminDashboardMetric = Readonly<{
  label: string;
  value: number;
  tone: DashboardMetricTone;
}>;

type AdminDashboardViewProps = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  currentDateTime: string;
  metrics: readonly AdminDashboardMetric[];
  recentOrders: readonly RecentTravelOrderRow[];
}>;

export function AdminDashboardView({
  firstName,
  lastName,
  email,
  currentDateTime,
  metrics,
  recentOrders,
}: AdminDashboardViewProps) {
  const fullName = `${firstName} ${lastName}`.trim() || "Admin";

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-[#3B9F41] to-[#F0F0F0] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] sm:p-7">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome Back, {fullName}!
        </h2>
        <p className="mt-2 text-sm text-white/90">
          {currentDateTime}
        </p>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Dashboard metrics"
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

      <section aria-labelledby="recent-travel-orders-heading">
        <div className="mb-4">
          <h2
            id="recent-travel-orders-heading"
            className="text-2xl font-semibold tracking-tight text-[#2f3339]"
          >
            Recent Travel Orders
          </h2>
          <p className="mt-1 text-xs text-[#7b8398]">
            UI preview rows are temporary until travel-order data is connected.
          </p>
        </div>

        <RecentTravelOrdersTable rows={recentOrders} />
      </section>
    </div>
  );
}

export type { RecentTravelOrderRow };
