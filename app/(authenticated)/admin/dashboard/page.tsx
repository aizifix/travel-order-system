import { requireRole } from "@/src/server/auth/guards";
import { getAdminDashboardStats } from "@/src/server/dashboard/admin";
import { AdminShell, NotificationBellButton } from "@/src/components/admin/admin-shell";
import {
  AdminDashboardView,
  type AdminDashboardMetric,
  type RecentTravelOrderRow,
} from "@/src/components/admin/dashboard/admin-dashboard-view";

export const dynamic = "force-dynamic";

const PREVIEW_RECENT_ORDERS = [
  {
    toNo: "J26",
    datePosted: "February 24, 2026",
    requestedBy: "Gunduh Mo",
    destination: "Sa puso MO",
    travelDates: "Dec 12 - Jan 5",
    status: "Pending",
  },
  {
    toNo: "J26",
    datePosted: "February 21, 2026",
    requestedBy: "Gunduh Mo",
    destination: "Sa puso MO",
    travelDates: "Jan 3 - Feb 14",
    status: "Approved",
  },
  {
    toNo: "J26",
    datePosted: "February 19, 2026",
    requestedBy: "Gunduh Mo",
    destination: "Sa puso MO",
    travelDates: "July 7 - July 8",
    status: "Rejected",
  },
] as const satisfies readonly RecentTravelOrderRow[];

export default async function AdminDashboardPage() {
  const session = await requireRole("admin");
  const stats = await getAdminDashboardStats();
  const inactiveUsers = Math.max(stats.totalUsers - stats.activeUsers, 0);

  const metrics: readonly AdminDashboardMetric[] = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      tone: "warning",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      tone: "success",
    },
    {
      label: "Inactive Users",
      value: inactiveUsers,
      tone: "danger",
    },
  ];

  return (
    <AdminShell
      title="Dashboard"
      activeItem="dashboard"
      headerAction={<NotificationBellButton count={3} />}
    >
      <AdminDashboardView
        displayName={session.displayName}
        email={session.email}
        metrics={metrics}
        recentOrders={PREVIEW_RECENT_ORDERS}
      />
    </AdminShell>
  );
}
