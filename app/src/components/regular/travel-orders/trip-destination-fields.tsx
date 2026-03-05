"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { DateRangePickerCalendar } from "@/src/components/shared/date-range-picker-calendar";
import { PhilippineLocationDropdown } from "@/src/components/shared/philippine-location-dropdown";

const MAX_TOTAL_TRAVEL_DAYS = 5;
const ONE_DAY_MS = 86_400_000;
const DESTINATION_SUGGESTIONS_DATALIST_ID = "trip-destination-suggestions";
const DESTINATION_SUGGESTIONS = [
  "Region 10 - Cagayan de Oro City",
  "Region 10 - Iligan City",
  "Region 10 - Malaybalay City",
  "Region 10 - Valencia City",
  "Region 11 - Davao City",
  "Region 7 - Cebu City",
  "Region 6 - Iloilo City",
  "NCR - Quezon City",
  "NCR - Manila City",
  "CARAGA - Butuan City",
] as const;

export type TripDestinationInput = Readonly<{
  specificDestination: string;
  specificPurpose: string;
  departureDate: string;
  returnDate: string;
}>;

type TripDestinationFieldsProps = Readonly<{
  disabled?: boolean;
  defaultTrips?: readonly TripDestinationInput[];
}>;

type TripDraft = TripDestinationInput & Readonly<{ id: number }> & Readonly<{
  locationRegionCode?: string;
  locationProvinceCode?: string;
  locationCityMunicipalityCode?: string;
  locationBarangayCode?: string;
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

function daysBetweenInclusive(startIso: string, endIso: string): number | null {
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

function compareTripsByDate(
  left: Pick<TripDestinationInput, "departureDate" | "returnDate">,
  right: Pick<TripDestinationInput, "departureDate" | "returnDate">,
): number {
  const departureDiff = left.departureDate.localeCompare(right.departureDate);
  if (departureDiff !== 0) {
    return departureDiff;
  }

  return left.returnDate.localeCompare(right.returnDate);
}

function toDayLabel(dayCount: number): string {
  return `${dayCount} day${dayCount === 1 ? "" : "s"}`;
}

function formatDateLabel(value: string): string {
  if (!isIsoDate(value)) {
    return "";
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRangeLabel(startIso: string, endIso: string): string {
  const startLabel = formatDateLabel(startIso);
  const endLabel = formatDateLabel(endIso);

  if (startLabel && endLabel) {
    return `${startLabel} to ${endLabel}`;
  }

  if (startLabel) {
    return `${startLabel} to ...`;
  }

  return "Enter date range";
}

function createEmptyTrip(id: number): TripDraft {
  return {
    id,
    specificDestination: "",
    specificPurpose: "",
    departureDate: "",
    returnDate: "",
    locationRegionCode: "",
    locationProvinceCode: "",
    locationCityMunicipalityCode: "",
    locationBarangayCode: "",
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

function buildInitialTrips(defaultTrips: readonly TripDestinationInput[]): readonly TripDraft[] {
  const normalizedTrips = defaultTrips
    .map(normalizeTripInput)
    .filter(
      (trip) =>
        trip.specificDestination.length > 0 ||
        trip.specificPurpose.length > 0 ||
        trip.departureDate.length > 0 ||
        trip.returnDate.length > 0,
    );

  if (normalizedTrips.length === 0) {
    return [createEmptyTrip(1)];
  }

  return normalizedTrips.map((trip, index) => ({
    id: index + 1,
    ...trip,
  }));
}

export function TripDestinationFields({
  disabled = false,
  defaultTrips = [],
}: TripDestinationFieldsProps) {
  const [trips, setTrips] = useState<readonly TripDraft[]>(() =>
    buildInitialTrips(defaultTrips),
  );
  const [openCalendarTripId, setOpenCalendarTripId] = useState<number | null>(null);
  const nextTripIdRef = useRef(trips.length + 1);
  const validationInputRef = useRef<HTMLInputElement | null>(null);
  const openCalendarContainerRef = useRef<HTMLDivElement | null>(null);

  const tripDayCounts = useMemo(
    () =>
      trips.map((trip) => daysBetweenInclusive(trip.departureDate, trip.returnDate)),
    [trips],
  );

  const totalDays = useMemo(
    () =>
      tripDayCounts.reduce<number>(
        (sum, dayCount) => sum + (typeof dayCount === "number" ? dayCount : 0),
        0,
      ),
    [tripDayCounts],
  );

  const remainingDays = MAX_TOTAL_TRAVEL_DAYS - totalDays;

  const hasInvalidDateRange = useMemo(
    () =>
      trips.some((trip, index) => {
        const dayCount = tripDayCounts[index];
        if (!trip.departureDate || !trip.returnDate) {
          return false;
        }
        return dayCount === null;
      }),
    [tripDayCounts, trips],
  );

  const hasOverlap = useMemo(() => {
    const validTrips = trips
      .filter((trip) => daysBetweenInclusive(trip.departureDate, trip.returnDate) !== null)
      .map((trip) => ({
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
      }))
      .sort(compareTripsByDate);

    for (let index = 1; index < validTrips.length; index += 1) {
      const previousTrip = validTrips[index - 1];
      const currentTrip = validTrips[index];

      if (currentTrip.departureDate <= previousTrip.returnDate) {
        return true;
      }
    }

    return false;
  }, [trips]);

  const validationMessage = useMemo(() => {
    if (hasInvalidDateRange) {
      return "Each trip date range must end on or after the selected start date.";
    }

    if (hasOverlap) {
      return "Trip dates must not overlap.";
    }

    if (remainingDays < 0) {
      return `Total travel days exceed ${MAX_TOTAL_TRAVEL_DAYS}. Remove ${Math.abs(remainingDays)} day${Math.abs(remainingDays) === 1 ? "" : "s"} from your trip plan.`;
    }

    return "";
  }, [hasInvalidDateRange, hasOverlap, remainingDays]);

  useEffect(() => {
    const validationInput = validationInputRef.current;
    if (!validationInput) {
      return;
    }

    validationInput.setCustomValidity(disabled ? "" : validationMessage);
  }, [disabled, validationMessage]);

  useEffect(() => {
    if (openCalendarTripId === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const openContainer = openCalendarContainerRef.current;
      if (openContainer?.contains(target)) {
        return;
      }

      setOpenCalendarTripId(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenCalendarTripId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openCalendarTripId]);

  const payloadTrips = useMemo(
    () => trips.map((trip) => normalizeTripInput(trip)),
    [trips],
  );

  const tripsJson = useMemo(() => JSON.stringify(payloadTrips), [payloadTrips]);

  const sortedValidTrips = useMemo(() => {
    return payloadTrips
      .filter((trip) => daysBetweenInclusive(trip.departureDate, trip.returnDate) !== null)
      .sort(compareTripsByDate);
  }, [payloadTrips]);

  const hiddenDepartureDate = sortedValidTrips[0]?.departureDate ?? "";
  const hiddenReturnDate = sortedValidTrips[sortedValidTrips.length - 1]?.returnDate ?? "";
  const hiddenTravelDays = sortedValidTrips.reduce((sum, trip) => {
    const dayCount = daysBetweenInclusive(trip.departureDate, trip.returnDate);
    return sum + (dayCount ?? 0);
  }, 0);
  const hiddenSpecificDestination = sortedValidTrips
    .map((trip) => trip.specificDestination)
    .join("\n");
  const hiddenSpecificPurpose = sortedValidTrips
    .map((trip) => trip.specificPurpose)
    .join("\n");

  const canAddTrip = trips.length < MAX_TOTAL_TRAVEL_DAYS;

  const updateTripField = (
    tripId: number,
    field: keyof Omit<TripDraft, "id">,
    value: string,
  ) => {
    setTrips((prev) =>
      prev.map((trip) => (trip.id === tripId ? { ...trip, [field]: value } : trip)),
    );
  };

  return (
    <div className="relative rounded-xl border border-[#d6e3bd] bg-[linear-gradient(180deg,#f8fcf2_0%,#ffffff_100%)] p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#dff0c8] text-[#4d7a1f]">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#2f3339]">Trip Destinations</p>
          <p className="mt-0.5 text-xs text-[#5d6780]">
            Add each destination with its own date range. Total across all trips
            must stay within {MAX_TOTAL_TRAVEL_DAYS} days.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe2b1] bg-[#f2f8e8] px-3 py-1 text-xs font-semibold text-[#42661d]">
          <CalendarDays className="h-3.5 w-3.5" />
          {totalDays} / {MAX_TOTAL_TRAVEL_DAYS} total days
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            remainingDays < 0
              ? "border border-[#ffd2d2] bg-[#fff5f5] text-[#c85050]"
              : remainingDays === 0
                ? "border border-[#cfe2b1] bg-[#f2f8e8] text-[#42661d]"
                : "border border-[#dfe1ed] bg-white text-[#5d6780]"
          }`}
        >
          {remainingDays >= 0
            ? `${remainingDays} day${remainingDays === 1 ? "" : "s"} remaining`
            : `${Math.abs(remainingDays)} day${Math.abs(remainingDays) === 1 ? "" : "s"} over limit`}
        </span>
      </div>

      {validationMessage ? (
        <p className="mt-2 text-xs text-[#a33a3a]">{validationMessage}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {trips.map((trip, index) => {
          const dayCount = tripDayCounts[index];
          const hasDateRangeError =
            Boolean(trip.departureDate) &&
            Boolean(trip.returnDate) &&
            dayCount === null;

          return (
            <div
              key={trip.id}
              className="rounded-lg border border-[#dfe1ed] bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                  Trip {index + 1}
                </p>
                <div className="flex items-center gap-2">
                  {typeof dayCount === "number" ? (
                    <span className="inline-flex rounded-md border border-[#dfe8cf] bg-[#f6faef] px-2 py-0.5 text-[11px] font-semibold text-[#4b662d]">
                      {toDayLabel(dayCount)}
                    </span>
                  ) : null}
                  {trips.length > 1 ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setTrips((prev) =>
                          prev.filter((candidate) => candidate.id !== trip.id),
                        );
                        setOpenCalendarTripId((prev) =>
                          prev === trip.id ? null : prev,
                        );
                      }}
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#ffd2d2] bg-[#fff6f6] text-[#c85050] transition hover:bg-[#ffecec] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Remove trip ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PhilippineLocationDropdown
                  name={`trip_${trip.id}_destination`}
                  label="Specific Destination"
                  disabled={disabled}
                  defaultValues={{
                    regionCode: trip.locationRegionCode,
                    provinceCode: trip.locationProvinceCode,
                    cityMunicipalityCode: trip.locationCityMunicipalityCode,
                    barangayCode: trip.locationBarangayCode,
                  }}
                  onChange={(locationData) => {
                    updateTripField(trip.id, "specificDestination", locationData.fullAddress);
                    setTrips((prev) =>
                      prev.map((t) =>
                        t.id === trip.id
                          ? {
                              ...t,
                              locationRegionCode: locationData.values.region?.code,
                              locationProvinceCode: locationData.values.province?.code,
                              locationCityMunicipalityCode: locationData.values.cityMunicipality?.code,
                              locationBarangayCode: locationData.values.barangay?.code,
                            }
                          : t,
                      ),
                    );
                  }}
                />

                <label className="flex h-full flex-col">
                  <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
                    Specific Purpose
                  </span>
                  <textarea
                    rows={4}
                    required={!disabled}
                    disabled={disabled}
                    maxLength={120}
                    value={trip.specificPurpose}
                    onChange={(event) => {
                      updateTripField(trip.id, "specificPurpose", event.target.value);
                    }}
                    placeholder="Purpose for this trip"
                    className="min-h-[8.5rem] w-full flex-1 resize-none rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
                  />
                  <p className="mt-1 text-[11px] text-[#7d8598]">
                    {trip.specificPurpose.length}/120 characters
                  </p>
                </label>

                <div
                  className="relative block sm:col-span-2"
                  ref={
                    openCalendarTripId === trip.id
                      ? openCalendarContainerRef
                      : undefined
                  }
                >
                  <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">
                    Travel Date Range
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setOpenCalendarTripId((prev) => (prev === trip.id ? null : trip.id));
                    }}
                    className={`h-10 w-full rounded-lg border px-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      openCalendarTripId === trip.id
                        ? "border-[#3B9F41]/65 bg-[#3B9F41]/12 text-[#2f6b34]"
                        : "border-[#dfe1ed] bg-white text-[#2f3339] hover:border-[#3B9F41]/40"
                    }`}
                  >
                    {formatRangeLabel(trip.departureDate, trip.returnDate)}
                  </button>
                  <span className="mt-1 block text-[11px] text-[#7d8598]">
                    Click to select a range. Maximum allowed is 5 days.
                  </span>

                  {openCalendarTripId === trip.id ? (
                    <div className="absolute left-0 top-full z-40 mt-2 w-full max-w-[360px] rounded-xl border border-[#3B9F41]/25 bg-white/95 p-2 shadow-[0_16px_32px_rgba(30,77,35,0.22)] backdrop-blur-sm">
                      <DateRangePickerCalendar
                        startDate={trip.departureDate}
                        endDate={trip.returnDate}
                        disabled={disabled}
                        onRangeChange={(nextRange) => {
                          updateTripField(trip.id, "departureDate", nextRange.startDate);
                          updateTripField(trip.id, "returnDate", nextRange.endDate);
                          if (nextRange.startDate && nextRange.endDate) {
                            setOpenCalendarTripId(null);
                          }
                        }}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            updateTripField(trip.id, "departureDate", "");
                            updateTripField(trip.id, "returnDate", "");
                          }}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-3 text-xs font-semibold text-[#5d6780] transition hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Clear Range
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setOpenCalendarTripId(null);
                          }}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-3 text-xs font-semibold text-[#5d6780] transition hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-[#7d8598]">
                Use a single date range instead of separate departure/return fields.
              </p>

              {hasDateRangeError ? (
                <p className="mt-2 text-xs text-[#a33a3a]">
                  Date range is invalid. End date must be the same day or later than start date.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled || !canAddTrip}
        onClick={() => {
          setTrips((prev) => [...prev, createEmptyTrip(nextTripIdRef.current)]);
          nextTripIdRef.current += 1;
        }}
        className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#cfe2b1] bg-[#f2f8e8] px-3 text-sm font-semibold text-[#42661d] transition hover:bg-[#e6f1d6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        Add Trip Destination
      </button>

      <input type="hidden" name="tripsJson" value={tripsJson} />
      <input type="hidden" name="travelDays" value={String(hiddenTravelDays)} />
      <input type="hidden" name="departureDate" value={hiddenDepartureDate} />
      <input type="hidden" name="returnDate" value={hiddenReturnDate} />
      <input type="hidden" name="specificDestination" value={hiddenSpecificDestination} />
      <input type="hidden" name="specificPurpose" value={hiddenSpecificPurpose} />
      <input
        ref={validationInputRef}
        type="text"
        readOnly
        tabIndex={-1}
        value={validationMessage ? "invalid" : "valid"}
        className="pointer-events-none absolute left-[-9999px] top-0 h-px w-px opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}
