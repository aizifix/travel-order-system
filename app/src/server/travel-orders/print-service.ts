import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/src/server/db/mysql";
import type { UserRole } from "@/src/server/auth/types";

type PrintableTravelOrderRow = RowDataPacket & {
  travel_order_id: number;
  travel_order_no: string;
  travel_status_name: string;
  travel_order_date_iso: string | null;
  departure_date_iso: string | null;
  return_date_iso: string | null;
  travel_days: number | null;
  destination: string;
  purpose: string;
  funding_source: string | null;
  remarks: string | null;
  requester_name: string | null;
  employment_status_name: string | null;
  requester_position_name: string | null;
  requester_designation_name: string | null;
  division_name: string | null;
  transportation_name: string | null;
  recommending_approver_name: string | null;
  recommending_approver_position: string | null;
  final_approver_name: string | null;
  final_approver_position: string | null;
};

type PrintableTravelOrderStaffRow = RowDataPacket & {
  staff_name: string | null;
  staff_position: string | null;
  staff_division: string | null;
};

type PrintableTravelOrderTripRow = RowDataPacket & {
  trip_id: number;
  trip_order: number | null;
  specific_destination: string | null;
  specific_purpose: string | null;
  departure_date_iso: string | null;
  return_date_iso: string | null;
};

export type PrintableTravelOrderStaff = Readonly<{
  name: string;
  position: string;
  division: string;
}>;

export type PrintableTravelOrderTrip = Readonly<{
  id: number;
  tripOrder: number;
  departureDateIso: string;
  returnDateIso: string;
  specificDestination: string;
  specificPurpose: string;
}>;

export type PrintableTravelOrderData = Readonly<{
  id: number;
  orderNo: string;
  orderDateIso: string;
  departureDateIso: string;
  returnDateIso: string;
  travelDays: number;
  destination: string;
  purpose: string;
  fundingSource: string;
  remarks: string;
  requesterName: string;
  employmentStatus: string;
  requesterPosition: string;
  requesterDesignation: string;
  division: string;
  unitOfPlace: string;
  transportation: string;
  recommendingApproverName: string;
  recommendingApproverPosition: string;
  finalApproverName: string;
  finalApproverPosition: string;
  otherStaff: readonly PrintableTravelOrderStaff[];
  trips: readonly PrintableTravelOrderTrip[];
}>;

export type GetPrintableTravelOrderResult = Readonly<
  | {
      ok: true;
      data: PrintableTravelOrderData;
    }
  | {
      ok: false;
      status: 400 | 404 | 409 | 500;
      message: string;
    }
>;

type PrintViewer = Readonly<{
  userId: number;
  role: UserRole;
}>;

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
}

function normalizeText(value: string | null | undefined, maxLength = 2000): string {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");
  return normalized.slice(0, maxLength);
}

function toStaffPositionLabel(row: PrintableTravelOrderStaffRow): string {
  const position = normalizeText(row.staff_position, 150);
  const division = normalizeText(row.staff_division, 255);
  if (position && division) {
    return `${position} (${division})`;
  }
  return position || division;
}

function getPrintAccessFilter(viewer: PrintViewer): Readonly<{
  whereClause: string;
  params: readonly number[];
  notFoundMessage: string;
}> {
  if (viewer.role === "regular") {
    return {
      whereClause: "AND t.requester_user_id = ?",
      params: [viewer.userId],
      notFoundMessage: "Travel order was not found for your account.",
    };
  }

  if (viewer.role === "approver") {
    return {
      whereClause: "AND t.recommending_approver_id = ?",
      params: [viewer.userId],
      notFoundMessage: "Travel order was not found in your assigned requests.",
    };
  }

  return {
    whereClause: "",
    params: [],
    notFoundMessage: "Travel order was not found.",
  };
}

export async function getPrintableTravelOrderForViewer(
  viewer: PrintViewer,
  travelOrderId: number,
): Promise<GetPrintableTravelOrderResult> {
  if (!Number.isInteger(travelOrderId) || travelOrderId < 1) {
    return {
      ok: false,
      status: 400,
      message: "Invalid travel-order reference.",
    };
  }

  const pool = getDbPool();
  const accessFilter = getPrintAccessFilter(viewer);

  try {
    const [rows] = await pool.execute<PrintableTravelOrderRow[]>(
      `
        SELECT
          t.travel_order_id,
          t.travel_order_no,
          s.travel_status_name,
          DATE_FORMAT(t.travel_order_date, '%Y-%m-%d') AS travel_order_date_iso,
          DATE_FORMAT(t.travel_order_deptDate, '%Y-%m-%d') AS departure_date_iso,
          DATE_FORMAT(t.travel_order_returnDate, '%Y-%m-%d') AS return_date_iso,
          t.travel_order_days AS travel_days,
          t.travel_order_specDestination AS destination,
          t.travel_order_specPurpose AS purpose,
          t.travel_order_fundingSource AS funding_source,
          t.travel_order_remarks AS remarks,
          CONCAT(req.user_firstName, ' ', req.user_lastName) AS requester_name,
          es.employment_status_name,
          req_pos.position_name AS requester_position_name,
          req_des.designation_name AS requester_designation_name,
          req_div.division_name,
          transport.transportation_name,
          CONCAT(rec.user_firstName, ' ', rec.user_lastName) AS recommending_approver_name,
          CONCAT_WS(', ', rec_pos.position_name, rec_des.designation_name) AS recommending_approver_position,
          CONCAT(fin.user_firstName, ' ', fin.user_lastName) AS final_approver_name,
          CONCAT_WS(', ', fin_pos.position_name, fin_des.designation_name) AS final_approver_position
        FROM travel_orders t
        INNER JOIN travel_statuses s ON s.travel_status_id = t.travel_status_id
        INNER JOIN users req ON req.user_id = t.requester_user_id
        LEFT JOIN divisions req_div ON req_div.division_id = t.division_id
        LEFT JOIN employment_statuses es ON es.employment_status_id = t.employment_status_id
        LEFT JOIN positions req_pos ON req_pos.position_id = t.position_id
        LEFT JOIN designations req_des ON req_des.designation_id = t.designation_id
        LEFT JOIN transportations transport ON transport.transportation_id = t.transportation_id
        LEFT JOIN users rec ON rec.user_id = t.recommending_approver_id
        LEFT JOIN positions rec_pos ON rec_pos.position_id = rec.position_id
        LEFT JOIN designations rec_des ON rec_des.designation_id = rec.designation_id
        LEFT JOIN users fin ON fin.user_id = t.approved_by_user_id
        LEFT JOIN positions fin_pos ON fin_pos.position_id = fin.position_id
        LEFT JOIN designations fin_des ON fin_des.designation_id = fin.designation_id
        WHERE t.travel_order_id = ?
          ${accessFilter.whereClause}
        LIMIT 1
      `,
      [travelOrderId, ...accessFilter.params],
    );

    const row = rows[0];
    if (!row) {
      return {
        ok: false,
        status: 404,
        message: accessFilter.notFoundMessage,
      };
    }

    if ((row.travel_status_name ?? "").toUpperCase() !== "APPROVED") {
      return {
        ok: false,
        status: 409,
        message:
          "Printable PDF is only available after final (step 2) approval.",
      };
    }

    const orderDateIso =
      row.travel_order_date_iso ?? row.departure_date_iso ?? row.return_date_iso;
    const departureDateIso = row.departure_date_iso ?? row.return_date_iso;
    const returnDateIso = row.return_date_iso ?? row.departure_date_iso;
    const normalizedTravelDays = Number.isFinite(row.travel_days)
      ? Math.max(1, Math.trunc(Number(row.travel_days)))
      : 1;

    if (!orderDateIso || !departureDateIso || !returnDateIso) {
      return {
        ok: false,
        status: 500,
        message: "Travel order dates are incomplete for printing.",
      };
    }

    let otherStaff: readonly PrintableTravelOrderStaff[] = [];

    try {
      const [staffRows] = await pool.execute<PrintableTravelOrderStaffRow[]>(
        `
          SELECT
            CONCAT(u.user_firstName, ' ', u.user_lastName) AS staff_name,
            p.position_name AS staff_position,
            d.division_name AS staff_division
          FROM travel_order_staff tos
          INNER JOIN users u ON u.user_id = tos.user_id
          LEFT JOIN positions p ON p.position_id = u.position_id
          LEFT JOIN divisions d ON d.division_id = u.division_id
          WHERE tos.travel_order_id = ?
          ORDER BY tos.travel_order_staff_id ASC
        `,
        [travelOrderId],
      );

      otherStaff = staffRows
        .map((staffRow) => ({
          name: normalizeText(staffRow.staff_name, 150),
          position: toStaffPositionLabel(staffRow),
          division: normalizeText(staffRow.staff_division, 255),
        }))
        .filter((staffRow) => staffRow.name.length > 0);
    } catch (error) {
      if (!isMissingTableError(error)) {
        throw error;
      }
    }

    let trips: readonly PrintableTravelOrderTrip[] = [];

    try {
      const [tripRows] = await pool.execute<PrintableTravelOrderTripRow[]>(
        `
          SELECT
            trip_id,
            trip_order,
            specific_destination,
            specific_purpose,
            DATE_FORMAT(departure_date, '%Y-%m-%d') AS departure_date_iso,
            DATE_FORMAT(return_date, '%Y-%m-%d') AS return_date_iso
          FROM travel_order_trips
          WHERE travel_order_id = ?
          ORDER BY trip_order ASC, departure_date ASC, trip_id ASC
        `,
        [travelOrderId],
      );

      trips = tripRows.map((tripRow, index) => {
        const fallbackTripOrder = index + 1;
        const normalizedTripOrder =
          Number.isFinite(tripRow.trip_order) && tripRow.trip_order !== null
            ? Math.max(1, Math.trunc(Number(tripRow.trip_order)))
            : fallbackTripOrder;
        const normalizedDepartureDateIso =
          tripRow.departure_date_iso ??
          tripRow.return_date_iso ??
          departureDateIso;
        const normalizedReturnDateIso =
          tripRow.return_date_iso ??
          tripRow.departure_date_iso ??
          returnDateIso;

        return {
          id: tripRow.trip_id,
          tripOrder: normalizedTripOrder,
          departureDateIso: normalizedDepartureDateIso,
          returnDateIso: normalizedReturnDateIso,
          specificDestination: normalizeText(
            tripRow.specific_destination ?? row.destination,
            2000,
          ),
          specificPurpose: normalizeText(tripRow.specific_purpose ?? row.purpose, 2000),
        };
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        throw error;
      }
    }

    return {
      ok: true,
      data: {
        id: row.travel_order_id,
        orderNo: normalizeText(row.travel_order_no, 50),
        orderDateIso,
        departureDateIso,
        returnDateIso,
        travelDays: normalizedTravelDays,
        destination: normalizeText(row.destination, 2000),
        purpose: normalizeText(row.purpose, 2000),
        fundingSource: normalizeText(row.funding_source, 255),
        remarks: normalizeText(row.remarks, 2000),
        requesterName: normalizeText(row.requester_name, 255) || "Unknown Requester",
        employmentStatus: normalizeText(row.employment_status_name, 100),
        requesterPosition: normalizeText(row.requester_position_name, 150),
        requesterDesignation: normalizeText(row.requester_designation_name, 150),
        division: normalizeText(row.division_name, 255),
        unitOfPlace: normalizeText(row.division_name, 255),
        transportation: normalizeText(row.transportation_name, 100),
        recommendingApproverName:
          normalizeText(row.recommending_approver_name, 255) || "Approver",
        recommendingApproverPosition:
          normalizeText(row.recommending_approver_position, 200) || "Approver",
        finalApproverName:
          normalizeText(row.final_approver_name, 255) || "Regional Executive Director",
        finalApproverPosition:
          normalizeText(row.final_approver_position, 200) ||
          "Regional Executive Director",
        otherStaff,
        trips,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        status: 500,
        message:
          "Travel-order tables are not available yet. Run migrations and try again.",
      };
    }

    throw error;
  }
}

export async function getPrintableTravelOrderForRequester(
  requesterUserId: number,
  travelOrderId: number,
): Promise<GetPrintableTravelOrderResult> {
  return getPrintableTravelOrderForViewer(
    {
      userId: requesterUserId,
      role: "regular",
    },
    travelOrderId,
  );
}
