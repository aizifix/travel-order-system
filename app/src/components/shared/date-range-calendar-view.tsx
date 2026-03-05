"use client";

import { useMemo } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const BOXED_RANGE_BACKGROUND = "bg-[#3B9F41]/8";

export type CalendarRangeInput = Readonly<{
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}>;

type DateRangeCalendarViewProps = Readonly<{
  ranges: readonly CalendarRangeInput[];
  maxMonths?: number;
  compact?: boolean;
  showLegend?: boolean;
  emptyMessage?: string;
}>;

type NormalizedCalendarRange = Readonly<{
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}>;

type CalendarDayCell = Readonly<{
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isInRange: boolean;
  isStart: boolean;
  isEnd: boolean;
}>;

type CalendarMonth = Readonly<{
  key: string;
  label: string;
  cells: readonly CalendarDayCell[];
}>;

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

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

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function monthDistance(start: Date, end: Date): number {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth())
  );
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function normalizeRanges(
  ranges: readonly CalendarRangeInput[],
): readonly NormalizedCalendarRange[] {
  const normalizedRanges: NormalizedCalendarRange[] = [];

  for (const range of ranges) {
    const startDate = parseIsoDate(range.startDate);
    const endDate = parseIsoDate(range.endDate);

    if (!startDate || !endDate || endDate.getTime() < startDate.getTime()) {
      continue;
    }

    normalizedRanges.push({
      id: range.id,
      label: range.label,
      startDate,
      endDate,
    });
  }

  return normalizedRanges.sort((left, right) => left.startDate.getTime() - right.startDate.getTime());
}

function buildCalendarMonths(
  ranges: readonly NormalizedCalendarRange[],
  maxMonths: number,
): readonly CalendarMonth[] {
  if (ranges.length === 0) {
    return [];
  }

  const firstMonth = getMonthStart(ranges[0].startDate);
  const lastMonth = getMonthStart(ranges[ranges.length - 1].endDate);
  const totalMonths = monthDistance(firstMonth, lastMonth) + 1;
  const monthCount = Math.min(Math.max(1, maxMonths), totalMonths);

  const months: CalendarMonth[] = [];

  for (let monthIndex = 0; monthIndex < monthCount; monthIndex += 1) {
    const monthStart = addMonths(firstMonth, monthIndex);
    const monthLabel = monthStart.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const gridStart = addDays(monthStart, -monthStart.getUTCDay());
    const cells: CalendarDayCell[] = [];

    for (let dayIndex = 0; dayIndex < 42; dayIndex += 1) {
      const currentDate = addDays(gridStart, dayIndex);
      const currentDateMs = currentDate.getTime();

      let isInRange = false;
      let isStart = false;
      let isEnd = false;

      for (const range of ranges) {
        const startMs = range.startDate.getTime();
        const endMs = range.endDate.getTime();

        if (currentDateMs >= startMs && currentDateMs <= endMs) {
          isInRange = true;
        }
        if (currentDateMs === startMs) {
          isStart = true;
        }
        if (currentDateMs === endMs) {
          isEnd = true;
        }
      }

      cells.push({
        isoDate: toIsoDate(currentDate),
        dayNumber: currentDate.getUTCDate(),
        inCurrentMonth: currentDate.getUTCMonth() === monthStart.getUTCMonth(),
        isInRange,
        isStart,
        isEnd,
      });
    }

    months.push({
      key: `${monthStart.getUTCFullYear()}-${monthStart.getUTCMonth() + 1}`,
      label: monthLabel,
      cells,
    });
  }

  return months;
}

export function DateRangeCalendarView({
  ranges,
  maxMonths = 4,
  compact = false,
  showLegend = true,
  emptyMessage = "Select valid date ranges to render the calendar preview.",
}: DateRangeCalendarViewProps) {
  const normalizedRanges = useMemo(() => normalizeRanges(ranges), [ranges]);
  const months = useMemo(
    () => buildCalendarMonths(normalizedRanges, maxMonths),
    [maxMonths, normalizedRanges],
  );

  const pointA = normalizedRanges[0]?.startDate ?? null;
  const pointB = normalizedRanges[normalizedRanges.length - 1]?.endDate ?? null;

  if (normalizedRanges.length === 0) {
    return (
      <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-xs text-[#7d8598]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {pointA ? (
          <span className="inline-flex rounded-full border border-[#3B9F41]/30 bg-[#3B9F41]/10 px-2.5 py-1 font-medium text-[#2f6b34]">
            Point A: {formatDateLabel(pointA)}
          </span>
        ) : null}
        {pointB ? (
          <span className="inline-flex rounded-full border border-[#3B9F41]/30 bg-[#3B9F41]/10 px-2.5 py-1 font-medium text-[#2f6b34]">
            Point B: {formatDateLabel(pointB)}
          </span>
        ) : null}
      </div>

      <div className={`mt-3 grid gap-3 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {months.map((month) => (
          <article
            key={month.key}
            className={`rounded-lg border border-[#dfe1ed] ${BOXED_RANGE_BACKGROUND} p-2`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#37573c]">
              {month.label}
            </p>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={`${month.key}-${label}`}
                  className="text-center text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6d7f72]"
                >
                  {label}
                </span>
              ))}

              {month.cells.map((cell) => {
                const cellTone = !cell.inCurrentMonth
                  ? "border-transparent bg-transparent text-[#c0c6d6]"
                  : cell.isStart || cell.isEnd
                    ? "border-[#3B9F41] bg-[#3B9F41] text-white ring-1 ring-[#3B9F41]/35 shadow-[inset_0_-2px_0_0_rgb(34_117_47_/_0.35)]"
                    : cell.isInRange
                      ? "border-[#3B9F41]/35 bg-[#3B9F41]/16 text-[#265b2b] shadow-[inset_0_-2px_0_0_rgb(59_159_65_/_0.45)]"
                      : "border-[#dfe1ed] bg-white text-[#5d6780]";

                return (
                  <span
                    key={`${month.key}-${cell.isoDate}`}
                    className={`inline-flex h-8 items-center justify-center rounded-md border text-[11px] font-medium ${cellTone}`}
                    aria-label={`${cell.isoDate}${cell.isStart ? " range start" : ""}${cell.isEnd ? " range end" : ""}`}
                  >
                    {cell.dayNumber}
                  </span>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {showLegend ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#5a655c]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3B9F41]/35 bg-[#3B9F41]/16 px-2 py-0.5">
            <span className="h-2 w-2 rounded-full bg-[#3B9F41]/70" />
            In range
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3B9F41] bg-[#3B9F41]/85 px-2 py-0.5 text-white">
            <span className="h-2 w-2 rounded-full bg-white/85" />
            Point A / Point B
          </span>
          {normalizedRanges.map((range) => (
            <span
              key={`range-chip-${range.id}`}
              className="inline-flex rounded-full border border-[#dfe1ed] bg-white px-2 py-0.5"
            >
              {range.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
