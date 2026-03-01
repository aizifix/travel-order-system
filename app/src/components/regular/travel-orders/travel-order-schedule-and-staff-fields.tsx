"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, Trash2, Users } from "lucide-react";

const MIN_TRAVEL_DAYS = 1;
const MAX_TRAVEL_DAYS = 5;
const ONE_DAY_MS = 86_400_000;

type TravelScheduleFieldsProps = Readonly<{
  disabled?: boolean;
  departureDateDefault?: string;
  returnDateDefault?: string;
  travelDaysDefault?: number;
  destinationDefault?: string;
  purposeDefault?: string;
}>;

type OtherStaffFieldsProps = Readonly<{
  disabled?: boolean;
  hasOtherStaffDefault?: boolean;
}>;

type StaffEntry = Readonly<{
  id: number;
  name: string;
  division: string;
  position: string;
}>;

type DailyPlanEntry = Readonly<{
  destination: string;
  purpose: string;
}>;

function clampTravelDays(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return MIN_TRAVEL_DAYS;
  }
  return Math.min(MAX_TRAVEL_DAYS, Math.max(MIN_TRAVEL_DAYS, Math.trunc(value ?? 1)));
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const baseDate = new Date(`${isoDate}T00:00:00Z`);
  const shiftedDate = new Date(baseDate.getTime() + days * ONE_DAY_MS);
  return shiftedDate.toISOString().slice(0, 10);
}

function getInclusiveRangeDays(startIso: string, endIso: string): number | null {
  if (!isIsoDate(startIso) || !isIsoDate(endIso)) {
    return null;
  }

  const startMs = new Date(`${startIso}T00:00:00Z`).getTime();
  const endMs = new Date(`${endIso}T00:00:00Z`).getTime();
  if (endMs < startMs) {
    return null;
  }

  return Math.floor((endMs - startMs) / ONE_DAY_MS) + 1;
}

function formatDateLabel(isoDate: string): string {
  if (!isIsoDate(isoDate)) {
    return "-";
  }

  const parsed = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function buildEmptyStaffEntry(id: number): StaffEntry {
  return {
    id,
    name: "",
    division: "",
    position: "",
  };
}

function parseMultilineEntries(value: string): readonly string[] {
  return value
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function TravelScheduleFields({
  disabled,
  departureDateDefault = "",
  returnDateDefault = "",
  travelDaysDefault,
  destinationDefault = "",
  purposeDefault = "",
}: TravelScheduleFieldsProps) {
  const controlId = useId();
  const returnDateRef = useRef<HTMLInputElement | null>(null);
  const initialTravelDays = clampTravelDays(
    Number.isFinite(travelDaysDefault) ? Number(travelDaysDefault) : MIN_TRAVEL_DAYS,
  );
  const [travelDays, setTravelDays] = useState<number>(initialTravelDays);
  const [departureDate, setDepartureDate] = useState<string>(departureDateDefault);
  const [returnDate, setReturnDate] = useState<string>(() => {
    if (isIsoDate(returnDateDefault)) {
      return returnDateDefault;
    }
    if (isIsoDate(departureDateDefault)) {
      return addDaysToIsoDate(departureDateDefault, initialTravelDays - 1);
    }
    return "";
  });

  const suggestedReturnDate = useMemo(() => {
    if (!isIsoDate(departureDate)) {
      return "";
    }
    return addDaysToIsoDate(departureDate, travelDays - 1);
  }, [departureDate, travelDays]);
  const maxReturnDate = useMemo(() => {
    if (!isIsoDate(departureDate)) {
      return "";
    }
    return addDaysToIsoDate(departureDate, MAX_TRAVEL_DAYS - 1);
  }, [departureDate]);
  const [dailyPlanByDate, setDailyPlanByDate] = useState<
    Readonly<Record<string, DailyPlanEntry>>
  >({});

  const inclusiveRangeDays = useMemo(
    () => getInclusiveRangeDays(departureDate, returnDate),
    [departureDate, returnDate],
  );
  const hasRangeMismatch =
    inclusiveRangeDays != null && inclusiveRangeDays !== travelDays;

  useEffect(() => {
    const returnDateInput = returnDateRef.current;
    if (!returnDateInput) {
      return;
    }

    returnDateInput.setCustomValidity(
      hasRangeMismatch
        ? "Travel days must match the inclusive range between departure and return dates."
        : "",
    );
  }, [hasRangeMismatch]);

  const dateSlots = useMemo(() => {
    if (!isIsoDate(departureDate)) {
      return [];
    }

    return Array.from({ length: travelDays }, (_, index) =>
      addDaysToIsoDate(departureDate, index),
    );
  }, [departureDate, travelDays]);
  const additionalDayCount = Math.max(0, travelDays - 1);

  const destinationLines = useMemo(
    () => parseMultilineEntries(destinationDefault),
    [destinationDefault],
  );
  const purposeLines = useMemo(
    () => parseMultilineEntries(purposeDefault),
    [purposeDefault],
  );

  const showReturnDateField = travelDays === 1;
  const isMultiDay = travelDays > 1;

  return (
    <div className="rounded-xl border border-[#d6e3bd] bg-[linear-gradient(180deg,#f8fcf2_0%,#ffffff_100%)] p-4">
      {!isMultiDay ? (
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#dff0c8] text-[#4d7a1f]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#2f3339]">Travel Date Planner</p>
            <p className="mt-0.5 text-xs text-[#5d6780]">
              Set total days first (max {MAX_TRAVEL_DAYS}). Return date is suggested
              from the departure date.
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={`${isMultiDay ? "mt-0" : "mt-4"} grid gap-4 ${
          isMultiDay ? "sm:grid-cols-1" : "sm:grid-cols-3"
        }`}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
            Total Travel Days
          </span>
          <input
            id={`${controlId}-travel-days`}
            type="number"
            name="travelDays"
            min={MIN_TRAVEL_DAYS}
            max={MAX_TRAVEL_DAYS}
            required
            disabled={disabled}
            value={travelDays}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              const nextTravelDays = clampTravelDays(
                Number.isFinite(parsed) ? parsed : null,
              );
              setTravelDays(nextTravelDays);
              if (isIsoDate(departureDate)) {
                setReturnDate(addDaysToIsoDate(departureDate, nextTravelDays - 1));
              } else {
                setReturnDate("");
              }
            }}
            className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
          />
        </label>

        {!isMultiDay ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
              Departure Date
            </span>
            <input
              id={`${controlId}-departure-date`}
              type="date"
              name="departureDate"
              required
              disabled={disabled}
              value={departureDate}
              onChange={(event) => {
                const nextDepartureDate = event.target.value;
                setDepartureDate(nextDepartureDate);
                if (isIsoDate(nextDepartureDate)) {
                  setReturnDate(addDaysToIsoDate(nextDepartureDate, travelDays - 1));
                } else {
                  setReturnDate("");
                }
              }}
              className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
            />
          </label>
        ) : null}

        {showReturnDateField ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
              Return Date
            </span>
            <input
              ref={returnDateRef}
              id={`${controlId}-return-date`}
              type="date"
              name="returnDate"
              required
              disabled={disabled}
              min={departureDate || undefined}
              max={maxReturnDate || undefined}
              value={returnDate}
              onChange={(event) => {
                const nextReturnDate = event.target.value;
                setReturnDate(nextReturnDate);
                const rangeDays = getInclusiveRangeDays(departureDate, nextReturnDate);
                if (
                  rangeDays != null &&
                  rangeDays >= MIN_TRAVEL_DAYS &&
                  rangeDays <= MAX_TRAVEL_DAYS
                ) {
                  setTravelDays(rangeDays);
                }
              }}
              className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
            />
          </label>
        ) : null}
      </div>
      {isMultiDay ? (
        <input type="hidden" name="departureDate" value={departureDate} />
      ) : null}
      {!showReturnDateField ? (
        <input type="hidden" name="returnDate" value={returnDate} />
      ) : null}

      {!isMultiDay ? (
        <p className="mt-3 rounded-lg border border-[#dfe8cf] bg-[#f6faef] px-3 py-2 text-xs text-[#4b662d]">
          Suggested return date:{" "}
          <span className="font-semibold">
            {suggestedReturnDate ? formatDateLabel(suggestedReturnDate) : "-"}
          </span>
        </p>
      ) : null}

      {hasRangeMismatch ? (
        <p className="mt-2 text-xs text-[#a33a3a]">
          Travel days must match the inclusive range between departure and return
          dates.
        </p>
      ) : null}

      {additionalDayCount > 0 ? (
        <div className="mt-4 rounded-lg border border-[#dfe1ed] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
            Daily Travel Breakdown
          </p>
          <p className="mt-1 text-xs text-[#7b8398]">
            Day 1 uses the main fields above. Fill day 2 onward below. Each row maps to the departure/return columns in the print table.
          </p>
          <div className="mt-3 hidden grid-cols-[90px_150px_150px_minmax(0,1fr)_minmax(0,1fr)] gap-2.5 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5d6780] sm:grid">
            <span>Day</span>
            <span>Departure Date</span>
            <span>Return Date</span>
            <span>Specific Destination</span>
            <span>Specific Purpose</span>
          </div>
          <div className="mt-2 rounded-lg border border-[#e6e9f2] bg-[#f7f9fd] p-2.5">
            <div className="grid gap-2.5 sm:grid-cols-[90px_150px_150px_minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
              <div className="flex items-center">
                <span className="text-xs font-semibold text-[#4a5266]">Day 1</span>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-[#4a5266] sm:hidden">
                  Departure Date
                </span>
                <input
                  type="date"
                  value={dateSlots[0] ?? departureDate}
                  required={!disabled}
                  disabled={disabled}
                  onChange={(event) => {
                    const nextDepartureDate = event.target.value;
                    setDepartureDate(nextDepartureDate);
                    if (isIsoDate(nextDepartureDate)) {
                      setReturnDate(addDaysToIsoDate(nextDepartureDate, travelDays - 1));
                    } else {
                      setReturnDate("");
                    }
                  }}
                  placeholder="Set departure date"
                  className="h-9 w-full rounded-md border border-[#dfe1ed] bg-white px-2.5 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-[#4a5266] sm:hidden">
                  Return Date
                </span>
                <input
                  type="date"
                  value={dateSlots[0] ?? ""}
                  readOnly
                  tabIndex={-1}
                  placeholder="Set departure date"
                  className="h-9 w-full rounded-md border border-[#dfe1ed] bg-white px-2.5 text-sm text-[#2f3339]"
                />
              </div>
              <div className="text-xs text-[#6c768c] sm:col-span-2">
                Specific destination and purpose for day 1 are taken from the main fields above.
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2.5">
            {Array.from({ length: additionalDayCount }, (_, additionalIndex) => {
              const dayIndex = additionalIndex + 1;
              const slotValue = dateSlots[dayIndex] ?? "";
              const fallbackDestination = destinationLines[dayIndex] ?? destinationLines[0] ?? "";
              const fallbackPurpose = purposeLines[dayIndex] ?? purposeLines[0] ?? "";
              const planEntry = dailyPlanByDate[slotValue] ?? {
                destination: fallbackDestination,
                purpose: fallbackPurpose,
              };

              return (
                <div
                  key={`${controlId}-slot-${dayIndex + 1}`}
                  className="block rounded-lg border border-[#e6e9f2] bg-[#fafbfe] p-2.5"
                >
                  <div className="grid gap-2.5 sm:grid-cols-[90px_150px_150px_minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
                    <div className="flex items-center">
                      <span className="text-xs font-semibold text-[#4a5266]">Day {dayIndex + 1}</span>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#4a5266] sm:hidden">
                        Departure Date
                      </span>
                      <input
                        type="date"
                        value={slotValue}
                        readOnly
                        tabIndex={-1}
                        placeholder="Set departure date"
                        className="h-9 w-full rounded-md border border-[#dfe1ed] bg-white px-2.5 text-sm text-[#2f3339]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#4a5266] sm:hidden">
                        Return Date
                      </span>
                      <input
                        type="date"
                        value={slotValue}
                        readOnly
                        tabIndex={-1}
                        placeholder="Set departure date"
                        className="h-9 w-full rounded-md border border-[#dfe1ed] bg-white px-2.5 text-sm text-[#2f3339]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#4a5266]">
                        <span className="sm:hidden">Specific Destination</span>
                      </span>
                      <input
                        type="text"
                        name="travelPlanDestinations[]"
                        value={planEntry.destination}
                        required={!disabled}
                        disabled={disabled}
                        onChange={(event) => {
                          const nextDestination = event.target.value;
                          setDailyPlanByDate((prev) => ({
                            ...prev,
                            [slotValue]: {
                              ...(prev[slotValue] ?? { destination: "", purpose: "" }),
                              destination: nextDestination,
                            },
                          }));
                        }}
                        placeholder="Destination for this date"
                        className="h-9 w-full rounded-md border border-[#dfe1ed] bg-white px-2.5 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#4a5266]">
                        <span className="sm:hidden">Specific Purpose</span>
                      </span>
                      <textarea
                        name="travelPlanPurposes[]"
                        rows={2}
                        value={planEntry.purpose}
                        required={!disabled}
                        disabled={disabled}
                        onChange={(event) => {
                          const nextPurpose = event.target.value;
                          setDailyPlanByDate((prev) => ({
                            ...prev,
                            [slotValue]: {
                              ...(prev[slotValue] ?? { destination: "", purpose: "" }),
                              purpose: nextPurpose,
                            },
                          }));
                        }}
                        placeholder="Purpose for this date"
                        className="w-full resize-none rounded-md border border-[#dfe1ed] bg-white px-2.5 py-1.5 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                      />
                    </label>
                  </div>
                  <input type="hidden" name="travelPlanDates[]" value={slotValue} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OtherStaffFields({
  disabled,
  hasOtherStaffDefault = false,
}: OtherStaffFieldsProps) {
  const [hasOtherStaff, setHasOtherStaff] = useState<boolean>(hasOtherStaffDefault);
  const [staffEntries, setStaffEntries] = useState<readonly StaffEntry[]>(() =>
    hasOtherStaffDefault ? [buildEmptyStaffEntry(1)] : [],
  );
  const nextStaffIdRef = useRef<number>(2);

  useEffect(() => {
    if (hasOtherStaff && staffEntries.length === 0) {
      setStaffEntries([buildEmptyStaffEntry(nextStaffIdRef.current)]);
      nextStaffIdRef.current += 1;
    }
  }, [hasOtherStaff, staffEntries.length]);

  const handleEntryChange = (
    entryId: number,
    field: "name" | "division" | "position",
    value: string,
  ) => {
    setStaffEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-[#4a5266]">
        <input
          type="checkbox"
          name="hasOtherStaff"
          checked={hasOtherStaff}
          disabled={disabled}
          onChange={(event) => {
            setHasOtherStaff(event.target.checked);
          }}
          className="h-4 w-4 rounded border-[#cfd4e2] text-[#3B9F41] focus:ring-[#3B9F41]"
        />
        <Users className="h-4 w-4 text-[#5d6780]" />
        Include other staff in this travel order
      </label>

      {hasOtherStaff ? (
        <div className="mt-4 space-y-3">
          {staffEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-lg border border-[#dfe1ed] bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                  Staff {index + 1}
                </p>
                {staffEntries.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStaffEntries((prev) =>
                        prev.filter((candidate) => candidate.id !== entry.id),
                      );
                    }}
                    disabled={disabled}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#ffd2d2] bg-[#fff6f6] text-[#c85050] transition hover:bg-[#ffecec] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Remove staff ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
                    Name
                  </span>
                  <input
                    type="text"
                    name="otherStaffNames[]"
                    value={entry.name}
                    disabled={disabled}
                    onChange={(event) => {
                      handleEntryChange(entry.id, "name", event.target.value);
                    }}
                    placeholder="Staff full name"
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
                    Division
                  </span>
                  <input
                    type="text"
                    name="otherStaffDivisions[]"
                    value={entry.division}
                    disabled={disabled}
                    onChange={(event) => {
                      handleEntryChange(entry.id, "division", event.target.value);
                    }}
                    placeholder="Division"
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
                    Position
                  </span>
                  <input
                    type="text"
                    name="otherStaffPositions[]"
                    value={entry.position}
                    disabled={disabled}
                    onChange={(event) => {
                      handleEntryChange(entry.id, "position", event.target.value);
                    }}
                    placeholder="Position"
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setStaffEntries((prev) => [
                ...prev,
                buildEmptyStaffEntry(nextStaffIdRef.current),
              ]);
              nextStaffIdRef.current += 1;
            }}
            disabled={disabled}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#cfe2b1] bg-[#f2f8e8] px-3 text-sm font-semibold text-[#42661d] transition hover:bg-[#e6f1d6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add More Staff
          </button>

          <p className="text-xs text-[#7b8398]">
            Staff names/division/position are prepared for later backend storage,
            based on template logic.
          </p>
        </div>
      ) : null}
    </div>
  );
}
