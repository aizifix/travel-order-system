import { Suspense } from "react";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { ApproverShell } from "@/src/components/approver/approver-shell";
import {
  ApproverDashboardMetrics,
  ApproverDashboardTable,
  type ApproverDashboardMetric,
  type ApproverRecentTravelOrder,
} from "@/src/components/approver/dashboard/approver-dashboard-view";
import {
  getApproverDashboardStats,
  getTravelOrdersForApprover,
} from "@/src/server/travel-orders/service";
import { MetricCardsSkeleton, Skeleton, TableSkeleton } from "@/src/components/ui/skeleton";

export const dynamic = "force-dynamic";

// Async component for metrics with its own Suspense
async function MetricsContent({ userId }: { userId: number }) {
  const stats = await getApproverDashboardStats(userId);

  const metrics: readonly ApproverDashboardMetric[] = [
    {
      label: "Total Assigned",
      value: stats.totalAssigned,
      tone: "warning",
    },
    {
      label: "Pending Step 1",
      value: stats.pendingOrders,
      tone: "warning",
    },
    {
      label: "Forwarded to Admin",
      value: stats.forwardedOrders,
      tone: "success",
    },
    {
      label: "Rejected",
      value: stats.rejectedOrders,
      tone: "danger",
    },
  ];

  return <ApproverDashboardMetrics metrics={metrics} />;
}

// Async component for table with its own Suspense
async function TableContent({ userId }: { userId: number }) {
  const recentOrders = await getTravelOrdersForApprover(userId, 6);

  const formattedOrders: readonly ApproverRecentTravelOrder[] = recentOrders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    requestedBy: order.requestedBy,
    destination: order.destination,
    departureDateLabel: order.departureDateLabel,
    returnDateLabel: order.returnDateLabel,
    status: order.status,
  }));

  return <ApproverDashboardTable recentOrders={formattedOrders} />;
}

export default async function ApproverDashboardPage() {
  const session = await requireRole("approver");
  const userData = await getUserWithDivision(session.userId);

  return (
    <ApproverShell
      title="Dashboard"
      activeItem="dashboard"
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
              <TableSkeleton rows={6} columns={6} />
            </div>
          }
        >
          <TableContent userId={session.userId} />
        </Suspense>
      </section>
    </ApproverShell>
  );
}
