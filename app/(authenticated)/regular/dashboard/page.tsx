import Link from "next/link";
import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import {
  getRegularDashboardStats,
  getTravelOrdersForRequester,
} from "@/src/server/travel-orders/service";
import { RegularShell } from "@/src/components/regular/regular-shell";
import {
  RegularDashboardView,
  type RegularDashboardMetric,
} from "@/src/components/regular/dashboard/regular-dashboard-view";

export const dynamic = "force-dynamic";

export default async function RegularDashboardPage() {
  const session = await requireRole("regular");

  const [userData, stats, recentOrders] = await Promise.all([
    getUserWithDivision(session.userId),
    getRegularDashboardStats(session.userId),
    getTravelOrdersForRequester(session.userId, 6),
  ]);

  const now = new Date();
  const dateTimeStr =
    now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) +
    " | " +
    now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

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

  return (
    <RegularShell
      title="Dashboard"
      activeItem="dashboard"
      headerAction={
        <Link
          href="/regular/travel-orders"
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
      <RegularDashboardView
        fullName={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim()}
        currentDateTime={dateTimeStr}
        metrics={metrics}
        recentOrders={recentOrders.map((order) => ({
          id: order.id,
          orderNo: order.orderNo,
          destination: order.destination,
          departureDateLabel: order.departureDateLabel,
          returnDateLabel: order.returnDateLabel,
          status: order.status,
        }))}
      />
    </RegularShell>
  );
}
