import type { ReactNode } from "react";

export type RecentTravelOrderStatus = "Pending" | "Approved" | "Rejected";

export type RecentTravelOrderRow = Readonly<{
  toNo: string;
  datePosted: string;
  requestedBy: string;
  destination: string;
  travelDates: string;
  status: RecentTravelOrderStatus;
}>;

type RecentTravelOrdersTableProps = Readonly<{
  rows: readonly RecentTravelOrderRow[];
}>;

export function RecentTravelOrdersTable({
  rows,
}: RecentTravelOrdersTableProps) {
  return (
    <div className="overflow-x-auto overflow-y-auto rounded-2xl border border-[#dfe1ed] bg-white w-full max-h-[calc(100vh-300px)]">
      <table className="min-w-[860px] w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[#f3f5fa] text-[#5d6780]">
          <tr className="border-b border-[#cfd4e2]">
            <HeaderCell>TO no.</HeaderCell>
            <HeaderCell>Date Posted</HeaderCell>
            <HeaderCell>Requested by</HeaderCell>
            <HeaderCell>Destination</HeaderCell>
            <HeaderCell>Travel Dates</HeaderCell>
            <HeaderCell>ORED Status</HeaderCell>
            <HeaderCell>Action</HeaderCell>
          </tr>
        </thead>

        <tbody className="text-sm text-[#4a5266]">
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr
                key={`${row.toNo}-${row.travelDates}-${row.status}`}
                className="border-b border-[#dfe1ed] last:border-b-0"
              >
                <BodyCell className="font-semibold">{row.toNo}</BodyCell>
                <BodyCell>{row.datePosted}</BodyCell>
                <BodyCell className="font-medium">{row.requestedBy}</BodyCell>
                <BodyCell className="font-medium">
                  <span className="block max-w-[180px] truncate" title={row.destination}>
                    {row.destination}
                  </span>
                </BodyCell>
                <BodyCell className="whitespace-nowrap">{row.travelDates}</BodyCell>
                <BodyCell>
                  <StatusPill status={row.status} />
                </BodyCell>
                <BodyCell>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#3c414b] transition hover:bg-black/5"
                    aria-label={`Open actions for ${row.toNo}`}
                  >
                    <VerticalDotsIcon />
                  </button>
                </BodyCell>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={7}
                className="px-5 py-6 text-center text-sm text-[#7d8598]"
              >
                No recent travel orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ children }: Readonly<{ children: string }>) {
  return (
    <th className="px-5 py-4 text-xs font-semibold tracking-tight whitespace-nowrap">
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <td className={`px-5 py-3.5 align-middle whitespace-nowrap ${className ?? ""}`}>
      {children}
    </td>
  );
}

function StatusPill({ status }: Readonly<{ status: RecentTravelOrderStatus }>) {
  const styles =
    status === "Approved"
      ? "bg-[#B3FBD2] text-[#26AF5D]"
      : status === "Rejected"
        ? "bg-[#FFB1B1] text-[#E35E5E]"
        : "bg-[#FEF6D2] text-[#C9AF37]";

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function VerticalDotsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
