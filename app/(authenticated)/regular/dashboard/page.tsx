import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getRegularDashboardStats,
  getTravelOrdersForRequester,
} from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import {
  RegularDashboardMetrics,
  RegularDashboardTable,
  type RegularDashboardMetric,
  type RegularRecentTravelOrder,
} from "@/src/components/regular/dashboard/regular-dashboard-view";
import { MetricCardsSkeleton, Skeleton, TableSkeleton } from "@/src/components/ui/skeleton";

export const dynamic = "force-dynamic";

// Async component for metrics with its own Suspense
async function MetricsContent({ userId }: { userId: number }) {
  const stats = await getRegularDashboardStats(userId);

  const metrics: readonly RegularDashboardMetric[] = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      tone: "warning",
    },
    {
      label: "Pending Approval",
      value: stats.pendingOrders,
      tone: "warning",
    },
    {
      label: "Approved",
      value: stats.approvedOrders,
      tone: "success",
    },
    {
      label: "Returned / Rejected",
      value: stats.returnedOrders + stats.rejectedOrders,
      tone: "danger",
    },
  ];

  return <RegularDashboardMetrics metrics={metrics} />;
}

// Async component for table with its own Suspense
async function TableContent({ userId }: { userId: number }) {
  const recentOrders = await getTravelOrdersForRequester(userId, 6);

  const formattedOrders: readonly RegularRecentTravelOrder[] = recentOrders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    destination: order.destination,
    departureDateLabel: order.departureDateLabel,
    returnDateLabel: order.returnDateLabel,
    status: order.status,
  }));

  return <RegularDashboardTable recentOrders={formattedOrders} />;
}

export default async function RegularDashboardPage() {
  const session = await requireRole("regular");
  const userData = await getUserWithDivision(session.userId);

  return (
    <RegularShell
      title="Dashboard"
      activeItem="dashboard"
      headerAction={
        <Link
          href="/regular/travel-orders/create-travel-order"
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
      {/* Welcome section - immediate render with user data */}
      <section className="rounded-2xl bg-gradient-to-r from-[#3B9F41] to-[#F0F0F0] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] sm:p-7">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome Back, {userData?.firstName ?? "User"}!
        </h2>
        <p className="mt-2 text-sm text-white/90">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {" | "}
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </section>

      {/* Metrics section with independent Suspense */}
      <section className="mt-8 lg:mt-10">
        <Suspense fallback={<MetricCardsSkeleton count={4} />}>
          <MetricsContent userId={session.userId} />
        </Suspense>
      </section>

      {/* Table section with independent Suspense */}
      <section className="mt-8 lg:mt-10">
        <Suspense
          fallback={
            <div>
              <div className="mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-1 h-3 w-64" />
              </div>
              <TableSkeleton rows={6} columns={4} />
            </div>
          }
        >
          <TableContent userId={session.userId} />
        </Suspense>
      </section>
    </RegularShell>
  );
}
