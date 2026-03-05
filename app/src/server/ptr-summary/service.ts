import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/src/server/db/mysql";

// PTR Summary item type - simplified version of travel order for summary view
export type PtrSummaryItem = Readonly<{
  id: number;
  orderNo: string;
  orderDateLabel: string;
  requestedBy: string;
  division: string | null;
  destination: string;
  purpose: string;
  departureDateLabel: string;
  returnDateLabel: string;
  status: string;
  travelDays: number;
  transportation: string | null;
  travelType: string | null;
}>;

export type PtrSummaryFilter = Readonly<{
  search?: string;
  status?: string;
  divisionId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}>;

export type PtrSummaryPagination = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type PtrSummaryResult = Readonly<{
  items: readonly PtrSummaryItem[];
  pagination: PtrSummaryPagination;
}>;

// Row types for database queries
type PtrSummaryRow = RowDataPacket & {
  travel_order_id: number;
  travel_order_no: string;
  travel_order_date_label: string | null;
  requester_first_name: string;
  requester_last_name: string;
  division_name: string | null;
  travel_order_specDestination: string;
  travel_order_specPurpose: string;
  travel_order_dept_date_label: string | null;
  travel_order_return_date_label: string | null;
  travel_status_name: string;
  travel_order_days: number;
  transportation_name: string | null;
  travel_type_name: string | null;
};

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
}

function mapPtrSummaryRow(row: PtrSummaryRow): PtrSummaryItem {
  return {
    id: row.travel_order_id,
    orderNo: row.travel_order_no,
    orderDateLabel: row.travel_order_date_label ?? "",
    requestedBy: `${row.requester_first_name} ${row.requester_last_name}`.trim(),
    division: row.division_name,
    destination: row.travel_order_specDestination,
    purpose: row.travel_order_specPurpose,
    departureDateLabel: row.travel_order_dept_date_label ?? "",
    returnDateLabel: row.travel_order_return_date_label ?? "",
    status: row.travel_status_name,
    travelDays: row.travel_order_days,
    transportation: row.transportation_name,
    travelType: row.travel_type_name,
  };
}

function buildPtrSummaryBaseQuery(): string {
  return `
    FROM travel_orders t
    INNER JOIN users u ON u.user_id = t.requester_user_id
    LEFT JOIN divisions d ON d.division_id = t.division_id
    LEFT JOIN transportations tr ON tr.transportation_id = t.transportation_id
    LEFT JOIN travel_types tt ON tt.travel_type_id = t.travel_type_id
    INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
  `;
}

function buildPtrSummaryWhereClause(
  filter: PtrSummaryFilter,
  params: (number | string)[],
  options: Readonly<{
    requesterUserId?: number;
    divisionId?: number;
    excludeDrafts?: boolean;
  }> = {}
): string {
  let whereClause = "WHERE 1=1";

  // Role-based filtering
  if (options.requesterUserId !== undefined) {
    whereClause += " AND t.requester_user_id = ?";
    params.push(options.requesterUserId);
  }

  if (options.divisionId !== undefined) {
    whereClause += " AND t.division_id = ?";
    params.push(options.divisionId);
  }

  // Exclude drafts for summary view (optional)
  if (options.excludeDrafts) {
    whereClause += " AND s.travel_status_name != 'DRAFT'";
  }

  // Filter by specific division
  if (filter.divisionId !== undefined && options.divisionId === undefined) {
    whereClause += " AND t.division_id = ?";
    params.push(filter.divisionId);
  }

  // Status filter
  if (filter.status && filter.status !== "all") {
    whereClause += " AND s.travel_status_name = ?";
    params.push(filter.status.toUpperCase());
  }

  // Date range filters
  if (filter.startDate) {
    whereClause += " AND t.travel_order_deptDate >= ?";
    params.push(filter.startDate);
  }

  if (filter.endDate) {
    whereClause += " AND t.travel_order_returnDate <= ?";
    params.push(filter.endDate);
  }

  // Search filter
  if (filter.search && filter.search.trim()) {
    const searchTerm = `%${filter.search.trim()}%`;
    whereClause += ` AND (
      t.travel_order_no LIKE ? OR
      t.travel_order_specDestination LIKE ? OR
      t.travel_order_specPurpose LIKE ? OR
      CONCAT(u.user_firstName, ' ', u.user_lastName) LIKE ?
    )`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  return whereClause;
}

function buildPtrSummarySelectColumns(): string {
  return `
    SELECT
      t.travel_order_id,
      t.travel_order_no,
      DATE_FORMAT(t.travel_order_date, '%b %e, %Y') AS travel_order_date_label,
      u.user_firstName AS requester_first_name,
      u.user_lastName AS requester_last_name,
      d.division_name,
      t.travel_order_specDestination,
      t.travel_order_specPurpose,
      DATE_FORMAT(t.travel_order_deptDate, '%b %e, %Y') AS travel_order_dept_date_label,
      DATE_FORMAT(t.travel_order_returnDate, '%b %e, %Y') AS travel_order_return_date_label,
      s.travel_status_name,
      t.travel_order_days,
      tr.transportation_name,
      tt.travel_type_name
  `;
}

// Get PTR summary for regular user (only their own travel orders)
export async function getPtrSummaryForRegular(
  requesterUserId: number,
  filter: PtrSummaryFilter
): Promise<PtrSummaryResult> {
  const pool = getDbPool();
  const safePage = Math.max(1, Math.trunc(filter.page || 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(filter.limit || 10)));

  try {
    // Count query
    const countParams: (number | string)[] = [];
    const countWhereClause = buildPtrSummaryWhereClause(filter, countParams, {
      requesterUserId,
      excludeDrafts: true,
    });
    const countSql = `SELECT COUNT(*) as total ${buildPtrSummaryBaseQuery()} ${countWhereClause}`;

    const [countResult] = await pool.execute<RowDataPacket[]>(countSql, countParams);
    const total = (countResult[0]?.total as number) || 0;
    const totalPages = Math.ceil(total / safeLimit);

    // Data query
    const dataParams: (number | string)[] = [];
    const dataWhereClause = buildPtrSummaryWhereClause(filter, dataParams, {
      requesterUserId,
      excludeDrafts: true,
    });

    const offset = (safePage - 1) * safeLimit;
    const dataSql = `
      ${buildPtrSummarySelectColumns()}
      ${buildPtrSummaryBaseQuery()}
      ${dataWhereClause}
      ORDER BY t.travel_order_date DESC
      LIMIT ? OFFSET ?
    `;
    dataParams.push(safeLimit, offset);

    const [rows] = await pool.execute<PtrSummaryRow[]>(dataSql, dataParams);

    return {
      items: rows.map(mapPtrSummaryRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        items: [],
        pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 },
      };
    }
    throw error;
  }
}

// Get PTR summary for approver (only their department's travel orders)
export async function getPtrSummaryForApprover(
  approverUserId: number,
  approverDivisionId: number | null,
  filter: PtrSummaryFilter
): Promise<PtrSummaryResult> {
  const pool = getDbPool();
  const safePage = Math.max(1, Math.trunc(filter.page || 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(filter.limit || 10)));

  try {
    // If approver has no division, they can only see travel orders they are assigned to as recommending approver
    const countParams: (number | string)[] = [];

    let countWhereClause = "WHERE 1=1 AND s.travel_status_name != 'DRAFT'";

    if (approverDivisionId !== null) {
      countWhereClause += " AND t.division_id = ?";
      countParams.push(approverDivisionId);
    } else {
      // Fallback: show only travel orders where they are the recommending approver
      countWhereClause += " AND t.recommending_approver_id = ?";
      countParams.push(approverUserId);
    }

    // Apply additional filters
    if (filter.status && filter.status !== "all") {
      countWhereClause += " AND s.travel_status_name = ?";
      countParams.push(filter.status.toUpperCase());
    }

    if (filter.startDate) {
      countWhereClause += " AND t.travel_order_deptDate >= ?";
      countParams.push(filter.startDate);
    }

    if (filter.endDate) {
      countWhereClause += " AND t.travel_order_returnDate <= ?";
      countParams.push(filter.endDate);
    }

    if (filter.search && filter.search.trim()) {
      const searchTerm = `%${filter.search.trim()}%`;
      countWhereClause += ` AND (
        t.travel_order_no LIKE ? OR
        t.travel_order_specDestination LIKE ? OR
        t.travel_order_specPurpose LIKE ? OR
        CONCAT(u.user_firstName, ' ', u.user_lastName) LIKE ?
      )`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countSql = `SELECT COUNT(*) as total ${buildPtrSummaryBaseQuery()} ${countWhereClause}`;
    const [countResult] = await pool.execute<RowDataPacket[]>(countSql, countParams);
    const total = (countResult[0]?.total as number) || 0;
    const totalPages = Math.ceil(total / safeLimit);

    // Data query with same filters
    const dataParams: (number | string)[] = [];

    let dataWhereClause = "WHERE 1=1 AND s.travel_status_name != 'DRAFT'";

    if (approverDivisionId !== null) {
      dataWhereClause += " AND t.division_id = ?";
      dataParams.push(approverDivisionId);
    } else {
      dataWhereClause += " AND t.recommending_approver_id = ?";
      dataParams.push(approverUserId);
    }

    if (filter.status && filter.status !== "all") {
      dataWhereClause += " AND s.travel_status_name = ?";
      dataParams.push(filter.status.toUpperCase());
    }

    if (filter.startDate) {
      dataWhereClause += " AND t.travel_order_deptDate >= ?";
      dataParams.push(filter.startDate);
    }

    if (filter.endDate) {
      dataWhereClause += " AND t.travel_order_returnDate <= ?";
      dataParams.push(filter.endDate);
    }

    if (filter.search && filter.search.trim()) {
      const searchTerm = `%${filter.search.trim()}%`;
      dataWhereClause += ` AND (
        t.travel_order_no LIKE ? OR
        t.travel_order_specDestination LIKE ? OR
        t.travel_order_specPurpose LIKE ? OR
        CONCAT(u.user_firstName, ' ', u.user_lastName) LIKE ?
      )`;
      dataParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const offset = (safePage - 1) * safeLimit;
    const dataSql = `
      ${buildPtrSummarySelectColumns()}
      ${buildPtrSummaryBaseQuery()}
      ${dataWhereClause}
      ORDER BY t.travel_order_date DESC
      LIMIT ? OFFSET ?
    `;
    dataParams.push(safeLimit, offset);

    const [rows] = await pool.execute<PtrSummaryRow[]>(dataSql, dataParams);

    return {
      items: rows.map(mapPtrSummaryRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        items: [],
        pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 },
      };
    }
    throw error;
  }
}

// Get PTR summary for admin (all travel orders with full filtering)
export async function getPtrSummaryForAdmin(
  filter: PtrSummaryFilter
): Promise<PtrSummaryResult> {
  const pool = getDbPool();
  const safePage = Math.max(1, Math.trunc(filter.page || 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(filter.limit || 10)));

  try {
    const countParams: (number | string)[] = [];
    const countWhereClause = buildPtrSummaryWhereClause(filter, countParams, {
      excludeDrafts: true,
    });

    const countSql = `SELECT COUNT(*) as total ${buildPtrSummaryBaseQuery()} ${countWhereClause}`;
    const [countResult] = await pool.execute<RowDataPacket[]>(countSql, countParams);
    const total = (countResult[0]?.total as number) || 0;
    const totalPages = Math.ceil(total / safeLimit);

    // Data query
    const dataParams: (number | string)[] = [];
    const dataWhereClause = buildPtrSummaryWhereClause(filter, dataParams, {
      excludeDrafts: true,
    });

    const offset = (safePage - 1) * safeLimit;
    const dataSql = `
      ${buildPtrSummarySelectColumns()}
      ${buildPtrSummaryBaseQuery()}
      ${dataWhereClause}
      ORDER BY t.travel_order_date DESC
      LIMIT ? OFFSET ?
    `;
    dataParams.push(safeLimit, offset);

    const [rows] = await pool.execute<PtrSummaryRow[]>(dataSql, dataParams);

    return {
      items: rows.map(mapPtrSummaryRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        items: [],
        pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 0 },
      };
    }
    throw error;
  }
}

// Get divisions for admin filter dropdown
export async function getDivisionsForFilter(): Promise<readonly { id: number; name: string }[]> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT division_id AS id, division_name AS name
      FROM divisions
      WHERE is_active = 1
      ORDER BY division_name ASC
    `);

    return rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
    }));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}
