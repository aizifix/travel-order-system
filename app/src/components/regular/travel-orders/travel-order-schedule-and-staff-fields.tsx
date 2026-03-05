"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import {
  TripDestinationFields,
  type TripDestinationInput,
} from "@/src/components/regular/travel-orders/trip-destination-fields";

const ONE_DAY_MS = 86_400_000;

type TravelScheduleFieldsProps = Readonly<{
  disabled?: boolean;
  departureDateDefault?: string;
  returnDateDefault?: string;
  travelDaysDefault?: number;
  destinationDefault?: string;
  purposeDefault?: string;
  tripsDefault?: readonly TripDestinationInput[];
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

function parseMultilineEntries(value: string): readonly string[] {
  return value
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function buildEmptyStaffEntry(id: number): StaffEntry {
  return {
    id,
    name: "",
    division: "",
    position: "",
  };
}

function normalizeTripInput(input: TripDestinationInput): TripDestinationInput {
  return {
    specificDestination: input.specificDestination.trim(),
    specificPurpose: input.specificPurpose.trim(),
    departureDate: input.departureDate.trim(),
    returnDate: input.returnDate.trim(),
  };
}

function resolveDefaultTrips(
  options: Readonly<{
    departureDateDefault: string;
    returnDateDefault: string;
    travelDaysDefault?: number;
    destinationDefault: string;
    purposeDefault: string;
    tripsDefault: readonly TripDestinationInput[];
  }>,
): readonly TripDestinationInput[] {
  const normalizedTrips = options.tripsDefault
    .map(normalizeTripInput)
    .filter(
      (trip) =>
        trip.specificDestination.length > 0 ||
        trip.specificPurpose.length > 0 ||
        trip.departureDate.length > 0 ||
        trip.returnDate.length > 0,
    );

  if (normalizedTrips.length > 0) {
    return normalizedTrips;
  }

  const departureDate = options.departureDateDefault.trim();
  const destinationLines = parseMultilineEntries(options.destinationDefault);
  const purposeLines = parseMultilineEntries(options.purposeDefault);

  let returnDate = options.returnDateDefault.trim();
  if (
    isIsoDate(departureDate) &&
    !isIsoDate(returnDate) &&
    Number.isFinite(options.travelDaysDefault) &&
    Number(options.travelDaysDefault) > 0
  ) {
    returnDate = addDaysToIsoDate(departureDate, Number(options.travelDaysDefault) - 1);
  }

  if (
    !departureDate &&
    !returnDate &&
    destinationLines.length === 0 &&
    purposeLines.length === 0
  ) {
    return [];
  }

  return [
    {
      specificDestination: destinationLines[0] ?? options.destinationDefault.trim(),
      specificPurpose: purposeLines[0] ?? options.purposeDefault.trim(),
      departureDate,
      returnDate,
    },
  ];
}

export function TravelScheduleFields({
  disabled,
  departureDateDefault = "",
  returnDateDefault = "",
  travelDaysDefault,
  destinationDefault = "",
  purposeDefault = "",
  tripsDefault = [],
}: TravelScheduleFieldsProps) {
  const defaultTrips = useMemo(
    () =>
      resolveDefaultTrips({
        departureDateDefault,
        returnDateDefault,
        travelDaysDefault,
        destinationDefault,
        purposeDefault,
        tripsDefault,
      }),
    [
      departureDateDefault,
      destinationDefault,
      purposeDefault,
      returnDateDefault,
      travelDaysDefault,
      tripsDefault,
    ],
  );

  return <TripDestinationFields disabled={disabled} defaultTrips={defaultTrips} />;
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
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#ffd2d2] bg-[#fff6f6] text-[#c85050] transition hover:bg-[#ffecec] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#cfe2b1] bg-[#f2f8e8] px-3 text-sm font-semibold text-[#42661d] transition hover:bg-[#e6f1d6] disabled:cursor-not-allowed disabled:opacity-60"
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
