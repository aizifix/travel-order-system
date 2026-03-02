import { requireRole } from "@/src/server/auth/guards";
import { getAdminDashboardStats } from "@/src/server/dashboard/admin";
import { getUserWithDivision } from "@/src/server/auth/service";
import { AdminShell } from "@/src/components/admin/admin-shell";
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
  const userData = await getUserWithDivision(session.userId);
  const inactiveUsers = Math.max(stats.totalUsers - stats.activeUsers, 0);

  const now = new Date();
  const dateTimeStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " | " + now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
      <AdminDashboardView
        firstName={userData?.firstName ?? ""}
        lastName={userData?.lastName ?? ""}
        email={session.email}
        currentDateTime={dateTimeStr}
        metrics={metrics}
        recentOrders={PREVIEW_RECENT_ORDERS}
      />
    </AdminShell>
  );
}
