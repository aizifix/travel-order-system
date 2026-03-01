import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "@/src/server/db/mysql";

const DRAFT_STATUS_ID = 1;
const PENDING_STATUS_ID = 2;
const STEP1_APPROVED_STATUS_ID = 3;
const REJECTED_STATUS_ID = 5;
const CANCELLED_STATUS_ID = 7;
const MAX_TRAVEL_ORDER_NUMBER_ATTEMPTS = 6;

type TravelOrderListRow = RowDataPacket & {
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
  created_at_label: string | null;
};

export type RecentTravelOrderItem = Readonly<{
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
  createdAtLabel: string;
}>;

type TravelOrderCountRow = RowDataPacket & {
  total_orders: number | null;
  draft_orders: number | null;
  pending_orders: number | null;
  approved_orders: number | null;
  returned_orders: number | null;
  rejected_orders: number | null;
};

export type RegularDashboardStats = Readonly<{
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  returnedOrders: number;
  rejectedOrders: number;
}>;

type LookupOptionRow = RowDataPacket & {
  id: number;
  name: string;
};

export type TravelOrderLookupOption = Readonly<{
  id: number;
  name: string;
}>;

export type TravelOrderCreationLookups = Readonly<{
  travelTypes: readonly TravelOrderLookupOption[];
  transportations: readonly TravelOrderLookupOption[];
  programs: readonly TravelOrderLookupOption[];
  recommendingApprovers: readonly TravelOrderLookupOption[];
}>;

type RequesterProfileRow = RowDataPacket & {
  user_id: number;
  user_firstName: string;
  user_lastName: string;
  user_email: string;
  division_id: number | null;
  division_name: string | null;
  position_id: number | null;
  position_name: string | null;
  designation_id: number | null;
  designation_name: string | null;
  employment_status_id: number | null;
  employment_status_name: string | null;
};

export type TravelOrderRequesterProfile = Readonly<{
  userId: number;
  fullName: string;
  email: string;
  divisionId: number | null;
  divisionName: string | null;
  positionId: number | null;
  positionName: string | null;
  designationId: number | null;
  designationName: string | null;
  employmentStatusId: number | null;
  employmentStatusName: string | null;
}>;

export type CreateRegularTravelOrderInput = Readonly<{
  travelTypeId: number | null;
  transportationId: number | null;
  programId: number | null;
  specificDestination: string;
  specificPurpose: string;
  fundingSource: string;
  remarks: string;
  travelDays: number | null;
  departureDate: string;
  returnDate: string;
  recommendingApproverId: number | null;
  hasOtherStaff: boolean;
  travelStatusRemarks: string;
  submitForApproval: boolean;
}>;

export type UpdateRegularTravelOrderInput = Readonly<{
  travelTypeId: number | null;
  transportationId: number | null;
  programId: number | null;
  specificDestination: string;
  specificPurpose: string;
  fundingSource: string;
  remarks: string;
  travelDays: number | null;
  departureDate: string;
  returnDate: string;
  recommendingApproverId: number | null;
  hasOtherStaff: boolean;
  travelStatusRemarks: string;
}>;

export type CreateRegularTravelOrderResult = Readonly<
  | {
      ok: true;
      travelOrderId: number;
      orderNo: string;
      statusLabel: "DRAFT" | "PENDING";
    }
  | {
      ok: false;
      message: string;
    }
>;

export type UpdateRegularTravelOrderResult = Readonly<
  | {
      ok: true;
      travelOrderId: number;
      orderNo: string;
    }
  | {
      ok: false;
      message: string;
    }
>;

export type CancelRegularTravelOrderResult = Readonly<
  | {
      ok: true;
      travelOrderId: number;
      orderNo: string;
    }
  | {
      ok: false;
      message: string;
    }
>;

type RequesterTravelOrderListRow = TravelOrderListRow & {
  travel_type_id: number | null;
  transportation_id: number | null;
  program_id: number | null;
  recommending_approver_id: number | null;
  recommending_approver_name: string | null;
  approved_by_name: string | null;
  travel_order_date_iso: string | null;
  travel_order_dept_date_iso: string | null;
  travel_order_return_date_iso: string | null;
  travel_order_fundingSource: string | null;
  travel_order_remarks: string | null;
  travel_order_days: number;
  has_other_staff: 0 | 1;
  travel_status_remarks: string | null;
  step1_action: "APPROVED" | "REJECTED" | "RETURNED" | null;
  step1_approver_name: string | null;
  step1_action_at_label: string | null;
  step1_remarks: string | null;
  step2_action: "APPROVED" | "REJECTED" | "RETURNED" | null;
  step2_approver_name: string | null;
  step2_action_at_label: string | null;
  step2_remarks: string | null;
};

type RequesterOwnedTravelOrderRow = RowDataPacket & {
  travel_order_id: number;
  travel_order_no: string;
  travel_status_id: number;
};

type ApproverOwnedTravelOrderRow = RowDataPacket & {
  travel_order_id: number;
  travel_order_no: string;
  travel_status_id: number;
};

export type TravelOrderApprovalAction = "APPROVED" | "REJECTED" | "RETURNED";

export type ApproverStep1Action = "APPROVED" | "REJECTED";

export type RequesterTravelOrderStep = Readonly<{
  stepNo: 1 | 2;
  roleLabel: string;
  expectedApproverName: string | null;
  action: TravelOrderApprovalAction | null;
  actedByName: string | null;
  actionAtLabel: string | null;
  remarks: string;
}>;

export type RequesterTravelOrderItem = RecentTravelOrderItem &
  Readonly<{
    travelTypeId: number | null;
    transportationId: number | null;
    programId: number | null;
    recommendingApproverId: number | null;
    recommendingApproverName: string | null;
    approvedByName: string | null;
    orderDateIso: string;
    departureDateIso: string;
    returnDateIso: string;
    fundingSource: string;
    remarks: string;
    travelDays: number;
    hasOtherStaff: boolean;
    travelStatusRemarks: string;
    step1: RequesterTravelOrderStep;
    step2: RequesterTravelOrderStep;
  }>;

export type ApproverTravelOrderItem = RequesterTravelOrderItem;

type ApproverDashboardCountRow = RowDataPacket & {
  total_assigned: number | null;
  pending_orders: number | null;
  forwarded_orders: number | null;
  rejected_orders: number | null;
};

export type ApproverDashboardStats = Readonly<{
  totalAssigned: number;
  pendingOrders: number;
  forwardedOrders: number;
  rejectedOrders: number;
}>;

export type ApproverPendingNotificationItem = Readonly<{
  id: number;
  orderNo: string;
  requestedBy: string;
  destination: string;
  orderDateLabel: string;
}>;

export type ReviewStep1TravelOrderInput = Readonly<{
  travelOrderId: number;
  action: ApproverStep1Action;
  remarks: string;
}>;

export type ReviewStep1TravelOrderResult = Readonly<
  | {
      ok: true;
      travelOrderId: number;
      orderNo: string;
      statusLabel: "STEP1_APPROVED" | "REJECTED";
    }
  | {
      ok: false;
      message: string;
    }
>;

type NormalizedTravelOrderInput = Readonly<{
  travelTypeId: number;
  transportationId: number;
  programId: number | null;
  specificDestination: string;
  specificPurpose: string;
  fundingSource: string;
  remarks: string;
  travelDays: number;
  departureDate: string;
  returnDate: string;
  recommendingApproverId: number | null;
  hasOtherStaff: boolean;
  travelStatusRemarks: string;
}>;

type TravelOrderLookupCheckRow = RowDataPacket & {
  has_travel_type: 0 | 1;
  has_transportation: 0 | 1;
  has_program: 0 | 1;
};

type ApproverValidationRow = RowDataPacket & {
  user_id: number;
};

type ApproverPendingNotificationRow = RowDataPacket & {
  travel_order_id: number;
  travel_order_no: string;
  requester_first_name: string;
  requester_last_name: string;
  travel_order_specDestination: string;
  travel_order_date_label: string | null;
};

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
}

function hasDuplicateEntryError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

function mapTravelOrderRow(row: TravelOrderListRow): RecentTravelOrderItem {
  const requestedBy =
    `${row.requester_first_name} ${row.requester_last_name}`.trim() ||
    "Unknown Requester";

  return {
    id: row.travel_order_id,
    orderNo: row.travel_order_no,
    orderDateLabel: row.travel_order_date_label ?? "-",
    requestedBy,
    division: row.division_name,
    destination: row.travel_order_specDestination,
    purpose: row.travel_order_specPurpose,
    departureDateLabel: row.travel_order_dept_date_label ?? "-",
    returnDateLabel: row.travel_order_return_date_label ?? "-",
    status: row.travel_status_name,
    createdAtLabel: row.created_at_label ?? "-",
  };
}

function mapRequesterTravelOrderRow(
  row: RequesterTravelOrderListRow,
): RequesterTravelOrderItem {
  return {
    ...mapTravelOrderRow(row),
    travelTypeId: row.travel_type_id,
    transportationId: row.transportation_id,
    programId: row.program_id,
    recommendingApproverId: row.recommending_approver_id,
    recommendingApproverName: row.recommending_approver_name,
    approvedByName: row.approved_by_name,
    orderDateIso: row.travel_order_date_iso ?? "",
    departureDateIso: row.travel_order_dept_date_iso ?? "",
    returnDateIso: row.travel_order_return_date_iso ?? "",
    fundingSource: row.travel_order_fundingSource ?? "",
    remarks: row.travel_order_remarks ?? "",
    travelDays: row.travel_order_days,
    hasOtherStaff: row.has_other_staff === 1,
    travelStatusRemarks: row.travel_status_remarks ?? "",
    step1: {
      stepNo: 1,
      roleLabel: "First Approver",
      expectedApproverName: row.recommending_approver_name,
      action: row.step1_action,
      actedByName: row.step1_approver_name,
      actionAtLabel: row.step1_action_at_label,
      remarks: row.step1_remarks ?? "",
    },
    step2: {
      stepNo: 2,
      roleLabel: "RED/Admin",
      expectedApproverName: null,
      action: row.step2_action,
      actedByName: row.step2_approver_name,
      actionAtLabel: row.step2_action_at_label,
      remarks: row.step2_remarks ?? "",
    },
  };
}

function mapApproverNotificationRow(
  row: ApproverPendingNotificationRow,
): ApproverPendingNotificationItem {
  return {
    id: row.travel_order_id,
    orderNo: row.travel_order_no,
    requestedBy:
      `${row.requester_first_name} ${row.requester_last_name}`.trim() ||
      "Unknown Requester",
    destination: row.travel_order_specDestination,
    orderDateLabel: row.travel_order_date_label ?? "-",
  };
}

function toNumber(value: number | null | undefined): number {
  return Number(value ?? 0);
}

function normalizeOptionalText(value: string, maxLength = 1000): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, maxLength);
}

function parseIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10) === trimmed ? trimmed : null;
}

function daysBetweenInclusive(startIso: string, endIso: string): number {
  const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
  const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
  const diff = endMs - startMs;
  return Math.floor(diff / 86_400_000) + 1;
}

function buildTravelOrderNo(attempt: number): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const randomPart = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const retrySuffix = attempt > 0 ? `-${attempt}` : "";
  return `TO-${year}${month}${day}-${randomPart}${retrySuffix}`;
}

function getStep1StatusForAction(
  action: ApproverStep1Action,
): Readonly<{ statusId: number; statusLabel: "STEP1_APPROVED" | "REJECTED" }> {
  if (action === "APPROVED") {
    return {
      statusId: STEP1_APPROVED_STATUS_ID,
      statusLabel: "STEP1_APPROVED",
    };
  }

  return {
    statusId: REJECTED_STATUS_ID,
    statusLabel: "REJECTED",
  };
}

function normalizeTravelOrderInput(
  input: Omit<CreateRegularTravelOrderInput, "submitForApproval">,
):
  | Readonly<{
      ok: true;
      data: NormalizedTravelOrderInput;
    }>
  | Readonly<{
      ok: false;
      message: string;
    }> {
  const travelTypeId = input.travelTypeId;
  const transportationId = input.transportationId;
  const programId = input.programId;
  const recommendingApproverId = input.recommendingApproverId;

  const specificDestination = normalizeOptionalText(input.specificDestination, 2000);
  const specificPurpose = normalizeOptionalText(input.specificPurpose, 2000);
  const fundingSource = normalizeOptionalText(input.fundingSource, 255);
  const remarks = normalizeOptionalText(input.remarks, 2000);
  const travelStatusRemarks = normalizeOptionalText(input.travelStatusRemarks, 2000);

  const departureDate = parseIsoDate(input.departureDate);
  const returnDate = parseIsoDate(input.returnDate);
  const travelDaysValue = input.travelDays;

  if (
    !Number.isInteger(travelTypeId) ||
    !Number.isInteger(transportationId) ||
    !Number.isInteger(travelDaysValue) ||
    !departureDate ||
    !returnDate
  ) {
    return {
      ok: false,
      message:
        "Travel type, transportation, dates, and number of days are required.",
    };
  }

  if (!specificDestination || !specificPurpose) {
    return {
      ok: false,
      message: "Specific destination and purpose are required.",
    };
  }

  const travelDays = travelDaysValue as number;

  if (travelDays < 1 || travelDays > 5) {
    return {
      ok: false,
      message: "Travel days must be between 1 and 5.",
    };
  }

  const computedDays = daysBetweenInclusive(departureDate, returnDate);
  if (computedDays < 1) {
    return {
      ok: false,
      message: "Return date must be the same as or later than departure date.",
    };
  }

  if (travelDays !== computedDays) {
    return {
      ok: false,
      message:
        "Travel days must match the inclusive range between departure and return dates.",
    };
  }

  const normalizedTravelTypeId = Number(travelTypeId);
  const normalizedTransportationId = Number(transportationId);

  return {
    ok: true,
    data: {
      travelTypeId: normalizedTravelTypeId,
      transportationId: normalizedTransportationId,
      programId,
      specificDestination,
      specificPurpose,
      fundingSource,
      remarks,
      travelDays,
      departureDate,
      returnDate,
      recommendingApproverId,
      hasOtherStaff: input.hasOtherStaff,
      travelStatusRemarks,
    },
  };
}

function mapRequesterProfile(row: RequesterProfileRow): TravelOrderRequesterProfile {
  return {
    userId: row.user_id,
    fullName: `${row.user_firstName} ${row.user_lastName}`.trim(),
    email: row.user_email,
    divisionId: row.division_id,
    divisionName: row.division_name,
    positionId: row.position_id,
    positionName: row.position_name,
    designationId: row.designation_id,
    designationName: row.designation_name,
    employmentStatusId: row.employment_status_id,
    employmentStatusName: row.employment_status_name,
  };
}

async function validateTravelOrderLookupSelection(
  input: Readonly<{
    travelTypeId: number;
    transportationId: number;
    programId: number | null;
  }>,
): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>> {
  const pool = getDbPool();

  const [lookupChecks] = await pool.execute<TravelOrderLookupCheckRow[]>(
    `
      SELECT
        EXISTS(
          SELECT 1
          FROM travel_types
          WHERE travel_type_id = ?
            AND is_active = 1
        ) AS has_travel_type,
        EXISTS(
          SELECT 1
          FROM transportations
          WHERE transportation_id = ?
            AND is_active = 1
        ) AS has_transportation,
        IF(
          ? IS NULL,
          1,
          EXISTS(
            SELECT 1
            FROM programs
            WHERE program_id = ?
              AND is_active = 1
          )
        ) AS has_program
    `,
    [input.travelTypeId, input.transportationId, input.programId, input.programId],
  );

  const lookupCheck = lookupChecks[0];
  if (
    !lookupCheck ||
    lookupCheck.has_travel_type !== 1 ||
    lookupCheck.has_transportation !== 1 ||
    lookupCheck.has_program !== 1
  ) {
    return {
      ok: false,
      message: "One or more selected lookup values are invalid or inactive.",
    };
  }

  return { ok: true };
}

async function validateApproverSelection(
  input: Readonly<{
    recommendingApproverId: number;
    divisionId: number | null;
  }>,
): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>> {
  const pool = getDbPool();

  const approverDivisionFilter =
    typeof input.divisionId === "number"
      ? "AND (u.division_id = ? OR u.division_id IS NULL)"
      : "";
  const approverParams =
    typeof input.divisionId === "number"
      ? [input.recommendingApproverId, input.divisionId]
      : [input.recommendingApproverId];

  const [approverRows] = await pool.execute<ApproverValidationRow[]>(
    `
      SELECT u.user_id
      FROM users u
      WHERE u.user_id = ?
        AND u.user_role = 'approver'
        AND u.user_isActive = 1
        ${approverDivisionFilter}
      LIMIT 1
    `,
    approverParams,
  );

  if (!approverRows[0]) {
    return {
      ok: false,
      message:
        "Selected recommending approver is invalid for your division scope.",
    };
  }

  return { ok: true };
}

export async function getRecentTravelOrders(
  limit = 20,
): Promise<readonly RecentTravelOrderItem[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<TravelOrderListRow[]>(
      `
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
          DATE_FORMAT(t.created_at, '%b %e, %Y') AS created_at_label
        FROM travel_orders t
        INNER JOIN users u ON u.user_id = t.requester_user_id
        LEFT JOIN divisions d ON d.division_id = t.division_id
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        ORDER BY t.created_at DESC
        LIMIT ?
      `,
      [safeLimit],
    );

    return rows.map(mapTravelOrderRow);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getTravelOrdersForRequester(
  requesterUserId: number,
  limit = 20,
): Promise<readonly RequesterTravelOrderItem[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<RequesterTravelOrderListRow[]>(
      `
        SELECT
          t.travel_order_id,
          t.travel_order_no,
          DATE_FORMAT(t.travel_order_date, '%b %e, %Y') AS travel_order_date_label,
          DATE_FORMAT(t.travel_order_date, '%Y-%m-%d') AS travel_order_date_iso,
          u.user_firstName AS requester_first_name,
          u.user_lastName AS requester_last_name,
          d.division_name,
          t.travel_order_specDestination,
          t.travel_order_specPurpose,
          DATE_FORMAT(t.travel_order_deptDate, '%b %e, %Y') AS travel_order_dept_date_label,
          DATE_FORMAT(t.travel_order_deptDate, '%Y-%m-%d') AS travel_order_dept_date_iso,
          DATE_FORMAT(t.travel_order_returnDate, '%b %e, %Y') AS travel_order_return_date_label,
          DATE_FORMAT(t.travel_order_returnDate, '%Y-%m-%d') AS travel_order_return_date_iso,
          t.travel_type_id,
          t.transportation_id,
          t.program_id,
          t.recommending_approver_id,
          t.travel_order_fundingSource,
          t.travel_order_remarks,
          t.travel_order_days,
          t.has_other_staff,
          t.travel_status_remarks,
          CONCAT(rec.user_firstName, ' ', rec.user_lastName) AS recommending_approver_name,
          CONCAT(fin.user_firstName, ' ', fin.user_lastName) AS approved_by_name,
          step1.action AS step1_action,
          step1.approver_name AS step1_approver_name,
          DATE_FORMAT(step1.action_at, '%b %e, %Y %h:%i %p') AS step1_action_at_label,
          step1.remarks AS step1_remarks,
          step2.action AS step2_action,
          step2.approver_name AS step2_approver_name,
          DATE_FORMAT(step2.action_at, '%b %e, %Y %h:%i %p') AS step2_action_at_label,
          step2.remarks AS step2_remarks,
          s.travel_status_name,
          DATE_FORMAT(t.created_at, '%b %e, %Y') AS created_at_label
        FROM travel_orders t
        INNER JOIN users u ON u.user_id = t.requester_user_id
        LEFT JOIN divisions d ON d.division_id = t.division_id
        LEFT JOIN users rec ON rec.user_id = t.recommending_approver_id
        LEFT JOIN users fin ON fin.user_id = t.approved_by_user_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u2.user_firstName, ' ', u2.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 1
            GROUP BY travel_order_id
          ) latest_step1 ON latest_step1.latest_approval_id = a.approval_id
          INNER JOIN users u2 ON u2.user_id = a.approver_user_id
        ) step1 ON step1.travel_order_id = t.travel_order_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u3.user_firstName, ' ', u3.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 2
            GROUP BY travel_order_id
          ) latest_step2 ON latest_step2.latest_approval_id = a.approval_id
          INNER JOIN users u3 ON u3.user_id = a.approver_user_id
        ) step2 ON step2.travel_order_id = t.travel_order_id
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        WHERE t.requester_user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
      `,
      [requesterUserId, safeLimit],
    );

    return rows.map(mapRequesterTravelOrderRow);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getTravelOrdersForApprover(
  approverUserId: number,
  limit = 40,
): Promise<readonly ApproverTravelOrderItem[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<RequesterTravelOrderListRow[]>(
      `
        SELECT
          t.travel_order_id,
          t.travel_order_no,
          DATE_FORMAT(t.travel_order_date, '%b %e, %Y') AS travel_order_date_label,
          DATE_FORMAT(t.travel_order_date, '%Y-%m-%d') AS travel_order_date_iso,
          u.user_firstName AS requester_first_name,
          u.user_lastName AS requester_last_name,
          d.division_name,
          t.travel_order_specDestination,
          t.travel_order_specPurpose,
          DATE_FORMAT(t.travel_order_deptDate, '%b %e, %Y') AS travel_order_dept_date_label,
          DATE_FORMAT(t.travel_order_deptDate, '%Y-%m-%d') AS travel_order_dept_date_iso,
          DATE_FORMAT(t.travel_order_returnDate, '%b %e, %Y') AS travel_order_return_date_label,
          DATE_FORMAT(t.travel_order_returnDate, '%Y-%m-%d') AS travel_order_return_date_iso,
          t.travel_type_id,
          t.transportation_id,
          t.program_id,
          t.recommending_approver_id,
          t.travel_order_fundingSource,
          t.travel_order_remarks,
          t.travel_order_days,
          t.has_other_staff,
          t.travel_status_remarks,
          CONCAT(rec.user_firstName, ' ', rec.user_lastName) AS recommending_approver_name,
          CONCAT(fin.user_firstName, ' ', fin.user_lastName) AS approved_by_name,
          step1.action AS step1_action,
          step1.approver_name AS step1_approver_name,
          DATE_FORMAT(step1.action_at, '%b %e, %Y %h:%i %p') AS step1_action_at_label,
          step1.remarks AS step1_remarks,
          step2.action AS step2_action,
          step2.approver_name AS step2_approver_name,
          DATE_FORMAT(step2.action_at, '%b %e, %Y %h:%i %p') AS step2_action_at_label,
          step2.remarks AS step2_remarks,
          s.travel_status_name,
          DATE_FORMAT(t.created_at, '%b %e, %Y') AS created_at_label
        FROM travel_orders t
        INNER JOIN users u ON u.user_id = t.requester_user_id
        LEFT JOIN divisions d ON d.division_id = t.division_id
        LEFT JOIN users rec ON rec.user_id = t.recommending_approver_id
        LEFT JOIN users fin ON fin.user_id = t.approved_by_user_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u2.user_firstName, ' ', u2.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 1
            GROUP BY travel_order_id
          ) latest_step1 ON latest_step1.latest_approval_id = a.approval_id
          INNER JOIN users u2 ON u2.user_id = a.approver_user_id
        ) step1 ON step1.travel_order_id = t.travel_order_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u3.user_firstName, ' ', u3.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 2
            GROUP BY travel_order_id
          ) latest_step2 ON latest_step2.latest_approval_id = a.approval_id
          INNER JOIN users u3 ON u3.user_id = a.approver_user_id
        ) step2 ON step2.travel_order_id = t.travel_order_id
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        WHERE t.recommending_approver_id = ?
          AND s.travel_status_name IN ('PENDING', 'STEP1_APPROVED', 'APPROVED', 'REJECTED', 'RETURNED')
        ORDER BY
          CASE s.travel_status_name
            WHEN 'PENDING' THEN 0
            WHEN 'STEP1_APPROVED' THEN 1
            WHEN 'APPROVED' THEN 2
            WHEN 'RETURNED' THEN 3
            WHEN 'REJECTED' THEN 4
            ELSE 5
          END,
          t.created_at DESC
        LIMIT ?
      `,
      [approverUserId, safeLimit],
    );

    return rows.map(mapRequesterTravelOrderRow);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getApproverPendingNotifications(
  approverUserId: number,
  limit = 8,
): Promise<readonly ApproverPendingNotificationItem[]> {
  const safeLimit = Math.min(20, Math.max(1, Math.trunc(limit)));
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<ApproverPendingNotificationRow[]>(
      `
        SELECT
          t.travel_order_id,
          t.travel_order_no,
          u.user_firstName AS requester_first_name,
          u.user_lastName AS requester_last_name,
          t.travel_order_specDestination,
          DATE_FORMAT(t.travel_order_date, '%b %e, %Y') AS travel_order_date_label
        FROM travel_orders t
        INNER JOIN users u ON u.user_id = t.requester_user_id
        WHERE t.recommending_approver_id = ?
          AND t.travel_status_id = ?
        ORDER BY t.created_at DESC
        LIMIT ?
      `,
      [approverUserId, PENDING_STATUS_ID, safeLimit],
    );

    return rows.map(mapApproverNotificationRow);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getApproverDashboardStats(
  approverUserId: number,
): Promise<ApproverDashboardStats> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<ApproverDashboardCountRow[]>(
      `
        SELECT
          COUNT(*) AS total_assigned,
          SUM(CASE WHEN s.travel_status_name = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
          SUM(CASE WHEN s.travel_status_name IN ('STEP1_APPROVED', 'APPROVED') THEN 1 ELSE 0 END) AS forwarded_orders,
          SUM(CASE WHEN s.travel_status_name = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_orders
        FROM travel_orders t
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        WHERE t.recommending_approver_id = ?
      `,
      [approverUserId],
    );

    const row = rows[0];

    return {
      totalAssigned: toNumber(row?.total_assigned),
      pendingOrders: toNumber(row?.pending_orders),
      forwardedOrders: toNumber(row?.forwarded_orders),
      rejectedOrders: toNumber(row?.rejected_orders),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        totalAssigned: 0,
        pendingOrders: 0,
        forwardedOrders: 0,
        rejectedOrders: 0,
      };
    }
    throw error;
  }
}

export async function getRegularDashboardStats(
  requesterUserId: number,
): Promise<RegularDashboardStats> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<TravelOrderCountRow[]>(
      `
        SELECT
          COUNT(*) AS total_orders,
          SUM(CASE WHEN s.travel_status_name = 'DRAFT' THEN 1 ELSE 0 END) AS draft_orders,
          SUM(CASE WHEN s.travel_status_name IN ('PENDING', 'STEP1_APPROVED') THEN 1 ELSE 0 END) AS pending_orders,
          SUM(CASE WHEN s.travel_status_name = 'APPROVED' THEN 1 ELSE 0 END) AS approved_orders,
          SUM(CASE WHEN s.travel_status_name = 'RETURNED' THEN 1 ELSE 0 END) AS returned_orders,
          SUM(CASE WHEN s.travel_status_name = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_orders
        FROM travel_orders t
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        WHERE t.requester_user_id = ?
      `,
      [requesterUserId],
    );

    const row = rows[0];

    return {
      totalOrders: toNumber(row?.total_orders),
      draftOrders: toNumber(row?.draft_orders),
      pendingOrders: toNumber(row?.pending_orders),
      approvedOrders: toNumber(row?.approved_orders),
      returnedOrders: toNumber(row?.returned_orders),
      rejectedOrders: toNumber(row?.rejected_orders),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        totalOrders: 0,
        draftOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        returnedOrders: 0,
        rejectedOrders: 0,
      };
    }
    throw error;
  }
}

export async function getRequesterTravelOrderProfile(
  userId: number,
): Promise<TravelOrderRequesterProfile | null> {
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<RequesterProfileRow[]>(
      `
        SELECT
          u.user_id,
          u.user_firstName,
          u.user_lastName,
          u.user_email,
          u.division_id,
          d.division_name,
          u.position_id,
          p.position_name,
          u.designation_id,
          des.designation_name,
          u.employment_status_id,
          e.employment_status_name
        FROM users u
        LEFT JOIN divisions d ON d.division_id = u.division_id
        LEFT JOIN positions p ON p.position_id = u.position_id
        LEFT JOIN designations des ON des.designation_id = u.designation_id
        LEFT JOIN employment_statuses e ON e.employment_status_id = u.employment_status_id
        WHERE u.user_id = ? AND u.user_isActive = 1
        LIMIT 1
      `,
      [userId],
    );

    const row = rows[0];
    return row ? mapRequesterProfile(row) : null;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getTravelOrderCreationLookups(
  divisionId: number | null,
): Promise<TravelOrderCreationLookups> {
  const pool = getDbPool();

  const approverDivisionFilter =
    typeof divisionId === "number"
      ? "AND (u.division_id = ? OR u.division_id IS NULL)"
      : "";
  const approverParams = typeof divisionId === "number" ? [divisionId] : [];

  try {
    const [travelTypeRows, transportationRows, programRows, approverRows] =
      await Promise.all([
        pool.execute<LookupOptionRow[]>(
          `
            SELECT travel_type_id AS id, travel_type_name AS name
            FROM travel_types
            WHERE is_active = 1
            ORDER BY travel_type_name ASC
          `,
        ),
        pool.execute<LookupOptionRow[]>(
          `
            SELECT transportation_id AS id, transportation_name AS name
            FROM transportations
            WHERE is_active = 1
            ORDER BY transportation_name ASC
          `,
        ),
        pool.execute<LookupOptionRow[]>(
          `
            SELECT program_id AS id, program_name AS name
            FROM programs
            WHERE is_active = 1
            ORDER BY program_name ASC
          `,
        ),
        pool.execute<LookupOptionRow[]>(
          `
            SELECT
              u.user_id AS id,
              CONCAT(u.user_firstName, ' ', u.user_lastName) AS name
            FROM users u
            WHERE u.user_role = 'approver'
              AND u.user_isActive = 1
              ${approverDivisionFilter}
            ORDER BY name ASC
          `,
          approverParams,
        ),
      ]);

    return {
      travelTypes: travelTypeRows[0],
      transportations: transportationRows[0],
      programs: programRows[0],
      recommendingApprovers: approverRows[0],
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        travelTypes: [],
        transportations: [],
        programs: [],
        recommendingApprovers: [],
      };
    }
    throw error;
  }
}

export async function createRegularTravelOrder(
  requesterUserId: number,
  input: CreateRegularTravelOrderInput,
): Promise<CreateRegularTravelOrderResult> {
  const normalizedInputResult = normalizeTravelOrderInput(input);
  if (!normalizedInputResult.ok) {
    return normalizedInputResult;
  }

  const normalizedInput = normalizedInputResult.data;
  if (
    input.submitForApproval &&
    !Number.isInteger(normalizedInput.recommendingApproverId)
  ) {
    return {
      ok: false,
      message: "Please select a recommending approver before submitting.",
    };
  }

  const profile = await getRequesterTravelOrderProfile(requesterUserId);
  if (!profile) {
    return {
      ok: false,
      message: "Requester profile was not found or is inactive.",
    };
  }

  if (!Number.isInteger(profile.divisionId) || !Number.isInteger(profile.employmentStatusId)) {
    return {
      ok: false,
      message:
        "Your account is missing division or employment status. Contact an administrator.",
    };
  }

  const pool = getDbPool();

  try {
    const lookupValidation = await validateTravelOrderLookupSelection({
      travelTypeId: normalizedInput.travelTypeId,
      transportationId: normalizedInput.transportationId,
      programId: normalizedInput.programId,
    });
    if (!lookupValidation.ok) {
      return lookupValidation;
    }

    if (Number.isInteger(normalizedInput.recommendingApproverId)) {
      const recommendingApproverId = Number(normalizedInput.recommendingApproverId);
      const approverValidation = await validateApproverSelection({
        recommendingApproverId,
        divisionId: profile.divisionId,
      });
      if (!approverValidation.ok) {
        return approverValidation;
      }
    }

    const statusId = input.submitForApproval ? PENDING_STATUS_ID : DRAFT_STATUS_ID;
    const statusLabel = input.submitForApproval ? "PENDING" : "DRAFT";

    for (let attempt = 0; attempt < MAX_TRAVEL_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNo = buildTravelOrderNo(attempt);

      try {
        const [insertResult] = await pool.execute<ResultSetHeader>(
          `
            INSERT INTO travel_orders (
              travel_order_no,
              requester_user_id,
              division_id,
              position_id,
              designation_id,
              employment_status_id,
              travel_type_id,
              transportation_id,
              program_id,
              travel_order_specDestination,
              travel_order_specPurpose,
              travel_order_fundingSource,
              travel_order_remarks,
              travel_order_days,
              travel_order_deptDate,
              travel_order_returnDate,
              has_other_staff,
              travel_status_id,
              travel_status_remarks,
              recommending_approver_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            orderNo,
            requesterUserId,
            profile.divisionId,
            profile.positionId,
            profile.designationId,
            profile.employmentStatusId,
            normalizedInput.travelTypeId,
            normalizedInput.transportationId,
            normalizedInput.programId,
            normalizedInput.specificDestination,
            normalizedInput.specificPurpose,
            normalizedInput.fundingSource || null,
            normalizedInput.remarks || null,
            normalizedInput.travelDays,
            normalizedInput.departureDate,
            normalizedInput.returnDate,
            normalizedInput.hasOtherStaff ? 1 : 0,
            statusId,
            normalizedInput.travelStatusRemarks || null,
            normalizedInput.recommendingApproverId,
          ],
        );

        return {
          ok: true,
          travelOrderId: insertResult.insertId,
          orderNo,
          statusLabel,
        };
      } catch (error) {
        if (hasDuplicateEntryError(error)) {
          continue;
        }
        if (isMissingTableError(error)) {
          return {
            ok: false,
            message:
              "Travel-order tables are not available yet. Run migrations and try again.",
          };
        }
        throw error;
      }
    }

    return {
      ok: false,
      message: "Unable to generate a unique travel order number. Please try again.",
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }
    throw error;
  }
}

export async function updateRegularTravelOrder(
  requesterUserId: number,
  travelOrderId: number,
  input: UpdateRegularTravelOrderInput,
): Promise<UpdateRegularTravelOrderResult> {
  if (!Number.isInteger(travelOrderId) || travelOrderId < 1) {
    return {
      ok: false,
      message: "Invalid travel-order reference.",
    };
  }

  const normalizedInputResult = normalizeTravelOrderInput(input);
  if (!normalizedInputResult.ok) {
    return normalizedInputResult;
  }
  const normalizedInput = normalizedInputResult.data;

  if (!Number.isInteger(normalizedInput.recommendingApproverId)) {
    return {
      ok: false,
      message: "Please select a recommending approver before updating.",
    };
  }
  const recommendingApproverId = Number(normalizedInput.recommendingApproverId);

  const profile = await getRequesterTravelOrderProfile(requesterUserId);
  if (!profile) {
    return {
      ok: false,
      message: "Requester profile was not found or is inactive.",
    };
  }

  if (!Number.isInteger(profile.divisionId) || !Number.isInteger(profile.employmentStatusId)) {
    return {
      ok: false,
      message:
        "Your account is missing division or employment status. Contact an administrator.",
    };
  }

  const pool = getDbPool();

  try {
    const [ownedRows] = await pool.execute<RequesterOwnedTravelOrderRow[]>(
      `
        SELECT
          travel_order_id,
          travel_order_no,
          travel_status_id
        FROM travel_orders
        WHERE travel_order_id = ?
          AND requester_user_id = ?
        LIMIT 1
      `,
      [travelOrderId, requesterUserId],
    );

    const ownedRow = ownedRows[0];
    if (!ownedRow) {
      return {
        ok: false,
        message: "Travel order was not found for your account.",
      };
    }

    if (ownedRow.travel_status_id !== PENDING_STATUS_ID) {
      return {
        ok: false,
        message: "Only pending travel orders can be edited.",
      };
    }

    const lookupValidation = await validateTravelOrderLookupSelection({
      travelTypeId: normalizedInput.travelTypeId,
      transportationId: normalizedInput.transportationId,
      programId: normalizedInput.programId,
    });
    if (!lookupValidation.ok) {
      return lookupValidation;
    }

    const approverValidation = await validateApproverSelection({
      recommendingApproverId,
      divisionId: profile.divisionId,
    });
    if (!approverValidation.ok) {
      return approverValidation;
    }

    const [updateResult] = await pool.execute<ResultSetHeader>(
      `
        UPDATE travel_orders
        SET
          travel_type_id = ?,
          transportation_id = ?,
          program_id = ?,
          travel_order_specDestination = ?,
          travel_order_specPurpose = ?,
          travel_order_fundingSource = ?,
          travel_order_remarks = ?,
          travel_order_days = ?,
          travel_order_deptDate = ?,
          travel_order_returnDate = ?,
          has_other_staff = ?,
          travel_status_remarks = ?,
          recommending_approver_id = ?
        WHERE travel_order_id = ?
          AND requester_user_id = ?
          AND travel_status_id = ?
      `,
      [
        normalizedInput.travelTypeId,
        normalizedInput.transportationId,
        normalizedInput.programId,
        normalizedInput.specificDestination,
        normalizedInput.specificPurpose,
        normalizedInput.fundingSource || null,
        normalizedInput.remarks || null,
        normalizedInput.travelDays,
        normalizedInput.departureDate,
        normalizedInput.returnDate,
        normalizedInput.hasOtherStaff ? 1 : 0,
        normalizedInput.travelStatusRemarks || null,
        recommendingApproverId,
        travelOrderId,
        requesterUserId,
        PENDING_STATUS_ID,
      ],
    );

    if (updateResult.affectedRows !== 1) {
      return {
        ok: false,
        message: "Travel order is no longer editable.",
      };
    }

    return {
      ok: true,
      travelOrderId,
      orderNo: ownedRow.travel_order_no,
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }
    throw error;
  }
}

export async function cancelRegularTravelOrder(
  requesterUserId: number,
  travelOrderId: number,
  reason: string,
): Promise<CancelRegularTravelOrderResult> {
  if (!Number.isInteger(travelOrderId) || travelOrderId < 1) {
    return {
      ok: false,
      message: "Invalid travel-order reference.",
    };
  }

  const normalizedReason = normalizeOptionalText(reason, 2000);

  const pool = getDbPool();

  try {
    const [ownedRows] = await pool.execute<RequesterOwnedTravelOrderRow[]>(
      `
        SELECT
          travel_order_id,
          travel_order_no,
          travel_status_id
        FROM travel_orders
        WHERE travel_order_id = ?
          AND requester_user_id = ?
        LIMIT 1
      `,
      [travelOrderId, requesterUserId],
    );

    const ownedRow = ownedRows[0];
    if (!ownedRow) {
      return {
        ok: false,
        message: "Travel order was not found for your account.",
      };
    }

    if (ownedRow.travel_status_id !== PENDING_STATUS_ID) {
      return {
        ok: false,
        message: "Only pending travel orders can be cancelled.",
      };
    }

    const [cancelResult] = await pool.execute<ResultSetHeader>(
      `
        UPDATE travel_orders
        SET
          travel_status_id = ?,
          travel_status_remarks = ?
        WHERE travel_order_id = ?
          AND requester_user_id = ?
          AND travel_status_id = ?
      `,
      [
        CANCELLED_STATUS_ID,
        normalizedReason || null,
        travelOrderId,
        requesterUserId,
        PENDING_STATUS_ID,
      ],
    );

    if (cancelResult.affectedRows !== 1) {
      return {
        ok: false,
        message: "Travel order is no longer cancellable.",
      };
    }

    return {
      ok: true,
      travelOrderId,
      orderNo: ownedRow.travel_order_no,
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }
    throw error;
  }
}

export async function reviewTravelOrderStep1(
  approverUserId: number,
  input: ReviewStep1TravelOrderInput,
): Promise<ReviewStep1TravelOrderResult> {
  if (!Number.isInteger(input.travelOrderId) || input.travelOrderId < 1) {
    return {
      ok: false,
      message: "Invalid travel-order reference.",
    };
  }

  const normalizedRemarks = normalizeOptionalText(input.remarks, 2000);
  if (input.action === "REJECTED" && !normalizedRemarks) {
    return {
      ok: false,
      message: "Please provide a reason before rejecting this request.",
    };
  }

  const nextStatus = getStep1StatusForAction(input.action);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  const rollbackSilently = async () => {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback errors to surface the root cause.
    }
  };

  try {
    await connection.beginTransaction();

    const [ownedRows] = await connection.execute<ApproverOwnedTravelOrderRow[]>(
      `
        SELECT
          travel_order_id,
          travel_order_no,
          travel_status_id
        FROM travel_orders
        WHERE travel_order_id = ?
          AND recommending_approver_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [input.travelOrderId, approverUserId],
    );

    const ownedRow = ownedRows[0];
    if (!ownedRow) {
      await rollbackSilently();
      return {
        ok: false,
        message: "Travel order was not found in your assigned queue.",
      };
    }

    if (ownedRow.travel_status_id !== PENDING_STATUS_ID) {
      await rollbackSilently();
      return {
        ok: false,
        message: "Only pending travel orders can be reviewed at step 1.",
      };
    }

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO travel_order_approvals (
          travel_order_id,
          step_no,
          approver_user_id,
          action,
          remarks
        )
        VALUES (?, 1, ?, ?, ?)
      `,
      [input.travelOrderId, approverUserId, input.action, normalizedRemarks || null],
    );

    const [updateResult] = await connection.execute<ResultSetHeader>(
      `
        UPDATE travel_orders
        SET
          travel_status_id = ?
        WHERE travel_order_id = ?
          AND recommending_approver_id = ?
          AND travel_status_id = ?
      `,
      [nextStatus.statusId, input.travelOrderId, approverUserId, PENDING_STATUS_ID],
    );

    if (updateResult.affectedRows !== 1) {
      await rollbackSilently();
      return {
        ok: false,
        message: "Travel order status changed before your review was saved.",
      };
    }

    await connection.commit();

    return {
      ok: true,
      travelOrderId: input.travelOrderId,
      orderNo: ownedRow.travel_order_no,
      statusLabel: nextStatus.statusLabel,
    };
  } catch (error) {
    await rollbackSilently();
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }
    throw error;
  } finally {
    connection.release();
  }
}

export type AdminTravelOrderItem = RequesterTravelOrderItem;

export type AdminStep2Action = "APPROVED" | "REJECTED" | "RETURNED";

export type ReviewStep2TravelOrderInput = Readonly<{
  travelOrderId: number;
  action: AdminStep2Action;
  remarks: string;
}>;

export type ReviewStep2TravelOrderResult = Readonly<
  | {
      ok: true;
      travelOrderId: number;
      orderNo: string;
      statusLabel: "APPROVED" | "REJECTED" | "RETURNED";
    }
  | {
      ok: false;
      message: string;
    }
>;

export async function getAllTravelOrdersForAdmin(
  limit = 40,
): Promise<readonly AdminTravelOrderItem[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const pool = getDbPool();

  try {
    const [rows] = await pool.execute<RequesterTravelOrderListRow[]>(
      `
        SELECT
          t.travel_order_id,
          t.travel_order_no,
          DATE_FORMAT(t.travel_order_date, '%b %e, %Y') AS travel_order_date_label,
          DATE_FORMAT(t.travel_order_date, '%Y-%m-%d') AS travel_order_date_iso,
          u.user_firstName AS requester_first_name,
          u.user_lastName AS requester_last_name,
          d.division_name,
          t.travel_order_specDestination,
          t.travel_order_specPurpose,
          DATE_FORMAT(t.travel_order_deptDate, '%b %e, %Y') AS travel_order_dept_date_label,
          DATE_FORMAT(t.travel_order_deptDate, '%Y-%m-%d') AS travel_order_dept_date_iso,
          DATE_FORMAT(t.travel_order_returnDate, '%b %e, %Y') AS travel_order_return_date_label,
          DATE_FORMAT(t.travel_order_returnDate, '%Y-%m-%d') AS travel_order_return_date_iso,
          t.travel_type_id,
          t.transportation_id,
          t.program_id,
          t.recommending_approver_id,
          t.travel_order_fundingSource,
          t.travel_order_remarks,
          t.travel_order_days,
          t.has_other_staff,
          t.travel_status_remarks,
          CONCAT(rec.user_firstName, ' ', rec.user_lastName) AS recommending_approver_name,
          CONCAT(fin.user_firstName, ' ', fin.user_lastName) AS approved_by_name,
          step1.action AS step1_action,
          step1.approver_name AS step1_approver_name,
          DATE_FORMAT(step1.action_at, '%b %e, %Y %h:%i %p') AS step1_action_at_label,
          step1.remarks AS step1_remarks,
          step2.action AS step2_action,
          step2.approver_name AS step2_approver_name,
          DATE_FORMAT(step2.action_at, '%b %e, %Y %h:%i %p') AS step2_action_at_label,
          step2.remarks AS step2_remarks,
          s.travel_status_name,
          DATE_FORMAT(t.created_at, '%b %e, %Y') AS created_at_label
        FROM travel_orders t
        INNER JOIN users u ON u.user_id = t.requester_user_id
        LEFT JOIN divisions d ON d.division_id = t.division_id
        LEFT JOIN users rec ON rec.user_id = t.recommending_approver_id
        LEFT JOIN users fin ON fin.user_id = t.approved_by_user_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u2.user_firstName, ' ', u2.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 1
            GROUP BY travel_order_id
          ) latest_step1 ON latest_step1.latest_approval_id = a.approval_id
          INNER JOIN users u2 ON u2.user_id = a.approver_user_id
        ) step1 ON step1.travel_order_id = t.travel_order_id
        LEFT JOIN (
          SELECT
            a.travel_order_id,
            a.action,
            a.remarks,
            a.action_at,
            CONCAT(u3.user_firstName, ' ', u3.user_lastName) AS approver_name
          FROM travel_order_approvals a
          INNER JOIN (
            SELECT travel_order_id, MAX(approval_id) AS latest_approval_id
            FROM travel_order_approvals
            WHERE step_no = 2
            GROUP BY travel_order_id
          ) latest_step2 ON latest_step2.latest_approval_id = a.approval_id
          INNER JOIN users u3 ON u3.user_id = a.approver_user_id
        ) step2 ON step2.travel_order_id = t.travel_order_id
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        ORDER BY t.created_at DESC
        LIMIT ?
      `,
      [safeLimit],
    );

    return rows.map(mapRequesterTravelOrderRow);
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

function getStep2StatusForAction(
  action: AdminStep2Action,
): Readonly<{ statusId: number; statusLabel: "APPROVED" | "REJECTED" | "RETURNED" }> {
  const APPROVED_STATUS_ID = 4;
  const REJECTED_STATUS_ID = 5;
  const RETURNED_STATUS_ID = 6;

  if (action === "APPROVED") {
    return {
      statusId: APPROVED_STATUS_ID,
      statusLabel: "APPROVED",
    };
  }

  if (action === "RETURNED") {
    return {
      statusId: RETURNED_STATUS_ID,
      statusLabel: "RETURNED",
    };
  }

  return {
    statusId: REJECTED_STATUS_ID,
    statusLabel: "REJECTED",
  };
}

export async function reviewTravelOrderStep2(
  adminUserId: number,
  input: ReviewStep2TravelOrderInput,
): Promise<ReviewStep2TravelOrderResult> {
  if (!Number.isInteger(input.travelOrderId) || input.travelOrderId < 1) {
    return {
      ok: false,
      message: "Invalid travel-order reference.",
    };
  }

  const normalizedRemarks = normalizeOptionalText(input.remarks, 2000);
  if ((input.action === "REJECTED" || input.action === "RETURNED") && !normalizedRemarks) {
    return {
      ok: false,
      message: "Please provide a reason before rejecting or returning this request.",
    };
  }

  const nextStatus = getStep2StatusForAction(input.action);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  const rollbackSilently = async () => {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback errors to surface the root cause.
    }
  };

  try {
    await connection.beginTransaction();

    const [ownedRows] = await connection.execute<ApproverOwnedTravelOrderRow[]>(
      `
        SELECT
          travel_order_id,
          travel_order_no,
          travel_status_id
        FROM travel_orders
        WHERE travel_order_id = ?
          AND travel_status_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [input.travelOrderId, STEP1_APPROVED_STATUS_ID],
    );

    const ownedRow = ownedRows[0];
    if (!ownedRow) {
      await rollbackSilently();
      return {
        ok: false,
        message: "Travel order was not found or is not ready for final review.",
      };
    }

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO travel_order_approvals (
          travel_order_id,
          step_no,
          approver_user_id,
          action,
          remarks
        )
        VALUES (?, 2, ?, ?, ?)
      `,
      [input.travelOrderId, adminUserId, input.action, normalizedRemarks || null],
    );

    const [updateResult] = await connection.execute<ResultSetHeader>(
      `
        UPDATE travel_orders
        SET
          travel_status_id = ?,
          approved_by_user_id = ?
        WHERE travel_order_id = ?
          AND travel_status_id = ?
      `,
      [nextStatus.statusId, adminUserId, input.travelOrderId, STEP1_APPROVED_STATUS_ID],
    );

    if (updateResult.affectedRows !== 1) {
      await rollbackSilently();
      return {
        ok: false,
        message: "Travel order status changed before your review was saved.",
      };
    }

    await connection.commit();

    return {
      ok: true,
      travelOrderId: input.travelOrderId,
      orderNo: ownedRow.travel_order_no,
      statusLabel: nextStatus.statusLabel,
    };
  } catch (error) {
    await rollbackSilently();
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }
    throw error;
  } finally {
    connection.release();
  }
}
