"use client";

import { useMemo } from "react";

export type TimelineTripItem = Readonly<{
  id: string;
  label: string;
  destination: string;
  purpose: string;
  departureDate: string;
  returnDate: string;
  days: number;
}>;

type TimelineViewProps = Readonly<{
  trips: readonly TimelineTripItem[];
  emptyMessage?: string;
  activeTripId?: string | null;
  onTripSelect?: (tripId: string) => void;
}>;

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDate(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function compareTripsByDate(left: TimelineTripItem, right: TimelineTripItem): number {
  const departureDiff = left.departureDate.localeCompare(right.departureDate);
  if (departureDiff !== 0) {
    return departureDiff;
  }

  return left.returnDate.localeCompare(right.returnDate);
}

function toDayLabel(dayCount: number): string {
  return `${dayCount} day${dayCount === 1 ? "" : "s"}`;
}

export function TimelineView({
  trips,
  emptyMessage = "No trip timeline entries are available.",
  activeTripId = null,
  onTripSelect,
}: TimelineViewProps) {
  const orderedTrips = useMemo(
    () => [...trips].sort(compareTripsByDate),
    [trips],
  );

  if (orderedTrips.length === 0) {
    return (
      <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-xs text-[#7d8598]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {orderedTrips.map((trip, index) => (
        <li
          key={trip.id}
          className="relative pl-7"
        >
          {index < orderedTrips.length - 1 ? (
            <span className="absolute left-[0.44rem] top-4 h-[calc(100%+0.75rem)] w-px bg-[#d7ddec]" />
          ) : null}
          <span className="absolute left-0 top-4 h-3.5 w-3.5 rounded-full border-2 border-[#6f97da] bg-white" />

          <button
            type="button"
            onClick={() => onTripSelect?.(trip.id)}
            className={`w-full rounded-xl border bg-white px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] outline-none transition ${
              activeTripId === trip.id
                ? "border-[#5b87d4] ring-1 ring-[#5b87d4]"
                : "border-[#dfe1ed] hover:border-[#c7d1e8]"
            }`}
            aria-pressed={activeTripId === trip.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4a5266]">
                {trip.label}
              </p>
              <span className="inline-flex rounded-md border border-[#d7e6c2] bg-[#f5faed] px-2 py-0.5 text-[11px] font-semibold text-[#4b662d]">
                {toDayLabel(Math.max(1, trip.days))}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-[#2f3339]">
              {trip.destination || "-"}
            </p>

            <p className="mt-1 text-xs text-[#5d6780]">
              {formatDate(trip.departureDate)} to {formatDate(trip.returnDate)}
            </p>

            <p className="mt-1 whitespace-pre-wrap text-xs text-[#5d6780]">
              {trip.purpose || "-"}
            </p>
          </button>
        </li>
      ))}
    </ol>
  );
}
