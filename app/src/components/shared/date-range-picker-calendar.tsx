"use client";

import { useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ONE_DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 5;

type DateRangePickerCalendarProps = Readonly<{
  startDate: string;
  endDate: string;
  onRangeChange: (nextRange: Readonly<{ startDate: string; endDate: string }>) => void;
  monthsToShow?: number;
  disabled?: boolean;
}>;

type CalendarDayCell = Readonly<{
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isSelectedRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  isHoverRange: boolean;
  isPreviewRange: boolean;
  isHoverAnchor: boolean;
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

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function toMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function clampRangeEnd(startDate: Date, candidateEndDate: Date): Date {
  const maxEndDate = addDays(startDate, MAX_RANGE_DAYS - 1);
  return candidateEndDate.getTime() > maxEndDate.getTime() ? maxEndDate : candidateEndDate;
}

function buildCalendarMonths(
  monthAnchor: Date,
  monthCount: number,
  selectedStart: Date | null,
  selectedEnd: Date | null,
  hoveredDate: Date | null,
): readonly CalendarMonth[] {
  const months: CalendarMonth[] = [];
  const safeMonthCount = Math.max(1, monthCount);
  const startMs = selectedStart?.getTime() ?? null;
  const endMs = selectedEnd?.getTime() ?? null;
  const hoveredMs = hoveredDate?.getTime() ?? null;

  const previewRangeStart =
    startMs != null && endMs == null ? startMs : hoveredMs;
  const previewRangeEnd =
    previewRangeStart != null
      ? addDays(new Date(previewRangeStart), MAX_RANGE_DAYS - 1).getTime()
      : null;

  const hoverRangeEnd =
    startMs != null && endMs == null && hoveredMs != null && hoveredMs >= startMs
      ? clampRangeEnd(new Date(startMs), new Date(hoveredMs)).getTime()
      : null;

  for (let monthIndex = 0; monthIndex < safeMonthCount; monthIndex += 1) {
    const monthStart = addMonths(monthAnchor, monthIndex);
    const gridStart = addDays(monthStart, -monthStart.getUTCDay());
    const cells: CalendarDayCell[] = [];

    for (let dayIndex = 0; dayIndex < 42; dayIndex += 1) {
      const currentDate = addDays(gridStart, dayIndex);
      const currentDateMs = currentDate.getTime();
      const isStart = startMs != null && currentDateMs === startMs;
      const isEnd = endMs != null && currentDateMs === endMs;
      const isSelectedRange =
        startMs != null && endMs != null && currentDateMs >= startMs && currentDateMs <= endMs;
      const isHoverRange =
        startMs != null &&
        endMs == null &&
        hoverRangeEnd != null &&
        currentDateMs >= startMs &&
        currentDateMs <= hoverRangeEnd;
      const isPreviewRange =
        previewRangeStart != null &&
        previewRangeEnd != null &&
        currentDateMs >= previewRangeStart &&
        currentDateMs <= previewRangeEnd;
      const isHoverAnchor = hoveredMs != null && currentDateMs === hoveredMs;

      cells.push({
        isoDate: toIsoDate(currentDate),
        dayNumber: currentDate.getUTCDate(),
        inCurrentMonth: currentDate.getUTCMonth() === monthStart.getUTCMonth(),
        isSelectedRange,
        isStart,
        isEnd,
        isHoverRange,
        isPreviewRange,
        isHoverAnchor,
      });
    }

    months.push({
      key: `${monthStart.getUTCFullYear()}-${monthStart.getUTCMonth() + 1}`,
      label: monthStart.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      cells,
    });
  }

  return months;
}

function formatDateLabel(value: string): string {
  const parsedDate = parseIsoDate(value);
  if (!parsedDate) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DateRangePickerCalendar({
  startDate,
  endDate,
  onRangeChange,
  monthsToShow = 1,
  disabled = false,
}: DateRangePickerCalendarProps) {
  const [hoveredDateIso, setHoveredDateIso] = useState<string>("");
  const [monthOffset, setMonthOffset] = useState(0);
  const selectedStart = parseIsoDate(startDate);
  const selectedEnd = parseIsoDate(endDate);
  const hoveredDate = parseIsoDate(hoveredDateIso);
  const monthAnchor = addMonths(toMonthStart(selectedStart ?? new Date()), monthOffset);

  const months = useMemo(
    () =>
      buildCalendarMonths(
        monthAnchor,
        monthsToShow,
        selectedStart,
        selectedEnd,
        hoveredDate,
      ),
    [hoveredDate, monthAnchor, monthsToShow, selectedEnd, selectedStart],
  );

  const handleDayClick = (clickedDateIso: string) => {
    if (disabled) {
      return;
    }

    const clickedDate = parseIsoDate(clickedDateIso);
    if (!clickedDate) {
      return;
    }

    if (!selectedStart || selectedEnd) {
      onRangeChange({
        startDate: clickedDateIso,
        endDate: "",
      });
      return;
    }

    if (clickedDate.getTime() < selectedStart.getTime()) {
      onRangeChange({
        startDate: clickedDateIso,
        endDate: "",
      });
      return;
    }

    const clampedEndDateIso = toIsoDate(clampRangeEnd(selectedStart, clickedDate));
    onRangeChange({
      startDate,
      endDate: clampedEndDateIso,
    });
  };

  const maxRangeHint =
    selectedStart && !selectedEnd
      ? `${formatDateLabel(toIsoDate(selectedStart))} to ${formatDateLabel(toIsoDate(addDays(selectedStart, MAX_RANGE_DAYS - 1)))}`
      : null;

  return (
    <div
      className="w-full max-w-[360px] rounded-lg border border-[#3B9F41]/35 bg-[#fafffa] p-2.5 shadow-sm"
      onMouseLeave={() => {
        setHoveredDateIso("");
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setMonthOffset((prev) => prev - 1);
          }}
          className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[#dfe1ed] bg-white px-2 text-xs font-semibold text-[#5d6780] transition hover:border-[#3B9F41]/35 hover:bg-[#3B9F41]/10 hover:text-[#2f6b34] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {"<"}
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#37573c]">
          {months[0]?.label ?? ""}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setMonthOffset((prev) => prev + 1);
          }}
          className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[#dfe1ed] bg-white px-2 text-xs font-semibold text-[#5d6780] transition hover:border-[#3B9F41]/35 hover:bg-[#3B9F41]/10 hover:text-[#2f6b34] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {">"}
        </button>
      </div>

      <div className="grid gap-2">
        {months.map((month) => (
          <article
            key={month.key}
            className="rounded-md border border-[#3B9F41]/25 bg-[#3B9F41]/8 p-2"
          >
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={`${month.key}-${label}`}
                  className="text-center text-[10px] font-semibold uppercase tracking-[0.05em] text-[#2f6b34]"
                >
                  {label}
                </span>
              ))}

              {month.cells.map((cell) => {
                const cellTone = cell.isStart || cell.isEnd
                    ? "border-[#3B9F41] bg-[#3B9F41] text-white ring-1 ring-[#3B9F41]/35 shadow-[inset_0_-2px_0_0_rgb(34_117_47_/_0.35)]"
                  : cell.isSelectedRange
                    ? "border-[#3B9F41]/70 bg-[#3B9F41]/70 text-white shadow-[inset_0_-2px_0_0_rgb(34_117_47_/_0.42)]"
                  : cell.isHoverRange
                      ? "border-[#3B9F41]/55 bg-[#3B9F41]/55 text-white shadow-[inset_0_-2px_0_0_rgb(34_117_47_/_0.36)]"
                      : cell.isHoverAnchor
                        ? "border-[#3B9F41]/70 bg-[#3B9F41]/70 text-white ring-1 ring-[#3B9F41]/38"
                        : cell.isPreviewRange
                          ? "border-[#3B9F41]/28 bg-[#3B9F41]/30 text-[#1f4f24] shadow-[inset_0_-2px_0_0_rgb(59_159_65_/_0.2)]"
                          : cell.inCurrentMonth
                            ? "border-[#dfe1ed] bg-white text-[#5d6780] hover:border-[#3B9F41]/35 hover:bg-[#3B9F41]/12 hover:text-[#2f6b34]"
                            : "border-[#e1e7f3] bg-[#3B9F41]/4 text-[#8e97ac] hover:border-[#3B9F41]/22 hover:bg-[#3B9F41]/8";

                return (
                  <button
                    key={`${month.key}-${cell.isoDate}`}
                    type="button"
                    disabled={disabled}
                    onMouseEnter={() => {
                      setHoveredDateIso(cell.isoDate);
                    }}
                    onClick={() => {
                      handleDayClick(cell.isoDate);
                    }}
                    className={`inline-flex h-8 w-full items-center justify-center rounded-md border text-[11px] font-medium transition ${cellTone} disabled:cursor-not-allowed disabled:opacity-70`}
                    aria-label={`${cell.isoDate}${cell.isStart ? " range start" : ""}${cell.isEnd ? " range end" : ""}`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-[#5a655c]">
        Hover previews up to {MAX_RANGE_DAYS} days. Pick start, then end.
      </p>
      {maxRangeHint ? (
        <p className="mt-1 text-[11px] text-[#2f6b34]">Max range: {maxRangeHint}</p>
      ) : null}
    </div>
  );
}
