import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { ApproverShell } from "@/src/components/approver/approver-shell";
import {
  ApproverDashboardView,
  type ApproverDashboardMetric,
} from "@/src/components/approver/dashboard/approver-dashboard-view";
import {
  getApproverDashboardStats,
  getTravelOrdersForApprover,
} from "@/src/server/travel-orders/service";

export const dynamic = "force-dynamic";

export default async function ApproverDashboardPage() {
  const session = await requireRole("approver");

  const [userData, stats, recentOrders] = await Promise.all([
    getUserWithDivision(session.userId),
    getApproverDashboardStats(session.userId),
    getTravelOrdersForApprover(session.userId, 6),
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
      <ApproverDashboardView
        fullName={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim()}
        currentDateTime={dateTimeStr}
        metrics={metrics}
        recentOrders={recentOrders.map((order) => ({
          id: order.id,
          orderNo: order.orderNo,
          requestedBy: order.requestedBy,
          destination: order.destination,
          departureDateLabel: order.departureDateLabel,
          returnDateLabel: order.returnDateLabel,
          status: order.status,
        }))}
      />
    </ApproverShell>
  );
}
