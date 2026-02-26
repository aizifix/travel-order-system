import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/src/server/db/mysql";

type AdminDashboardStatsRow = RowDataPacket & {
  total_users: number | null;
  active_users: number | null;
  approver_users: number | null;
  regular_users: number | null;
  admin_users: number | null;
};

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  approverUsers: number;
  regularUsers: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const pool = getDbPool();
  const [rows] = await pool.query<AdminDashboardStatsRow[]>(
    `
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN user_isActive = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN user_role = 'admin' THEN 1 ELSE 0 END) AS admin_users,
        SUM(CASE WHEN user_role = 'approver' THEN 1 ELSE 0 END) AS approver_users,
        SUM(CASE WHEN user_role = 'regular' THEN 1 ELSE 0 END) AS regular_users
      FROM users
    `,
  );

  const row = rows[0];

  return {
    totalUsers: Number(row?.total_users ?? 0),
    activeUsers: Number(row?.active_users ?? 0),
    adminUsers: Number(row?.admin_users ?? 0),
    approverUsers: Number(row?.approver_users ?? 0),
    regularUsers: Number(row?.regular_users ?? 0),
  };
}

