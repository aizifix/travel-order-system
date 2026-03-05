"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Pencil, X } from "lucide-react";
import type {
  RequesterTravelOrderItem,
  TravelOrderCreationLookups,
  TravelOrderLookupOption,
} from "@/src/server/travel-orders/service";
import {
  OtherStaffFields,
} from "@/src/components/regular/travel-orders/travel-order-schedule-and-staff-fields";
import { ApprovalWorkflowTimeline } from "@/src/components/travel-orders/approval-workflow-timeline";
import { OrderNumberCopy } from "@/src/components/travel-orders/order-number-copy";
import {
  TimelineView,
  type TimelineTripItem,
} from "@/src/components/shared/timeline-view";
import type { MapRouteStop } from "@/src/components/shared/map-view";

const ONE_DAY_MS = 86_400_000;

type EditableSectionId = "travel-details" | "staff";

const EDIT_SECTION_LABELS: Readonly<Record<EditableSectionId, string>> = {
  "travel-details": "Travel Details",
  staff: "Status & Staff",
};

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function toInclusiveDays(startDate: string, endDate: string): number {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return 1;
  }

  const startMs = new Date(`${startDate}T00:00:00Z`).getTime();
  const endMs = new Date(`${endDate}T00:00:00Z`).getTime();
  if (endMs < startMs) {
    return 1;
  }

  return Math.floor((endMs - startMs) / ONE_DAY_MS) + 1;
}

function parseMultilineEntries(value: string): readonly string[] {
  return value
    .split(/\r?\n+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function compareTripsByDate(
  left: Pick<TimelineTripItem, "departureDate" | "returnDate">,
  right: Pick<TimelineTripItem, "departureDate" | "returnDate">,
): number {
  const departureDiff = left.departureDate.localeCompare(right.departureDate);
  if (departureDiff !== 0) {
    return departureDiff;
  }

  return left.returnDate.localeCompare(right.returnDate);
}

function buildTimelineTrips(order: RequesterTravelOrderItem): readonly TimelineTripItem[] {
  if (order.trips.length > 0) {
    return [...order.trips]
      .sort(compareTripsByDate)
      .map((trip, index) => ({
        id: `trip-${trip.id}`,
        label: `Trip ${index + 1}`,
        destination: trip.specificDestination,
        purpose: trip.specificPurpose,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        days: toInclusiveDays(trip.departureDate, trip.returnDate),
      }));
  }

  if (!order.departureDateIso || !order.returnDateIso) {
    return [];
  }

  const destinationLines = parseMultilineEntries(order.destination);
  const purposeLines = parseMultilineEntries(order.purpose);

  return [
    {
      id: `trip-fallback-${order.id}`,
      label: "Trip 1",
      destination: destinationLines[0] ?? order.destination,
      purpose: purposeLines[0] ?? order.purpose,
      departureDate: order.departureDateIso,
      returnDate: order.returnDateIso,
      days: toInclusiveDays(order.departureDateIso, order.returnDateIso),
    },
  ];
}

function buildUpdateTripsPayload(order: RequesterTravelOrderItem): readonly {
  specificDestination: string;
  specificPurpose: string;
  departureDate: string;
  returnDate: string;
}[] {
  if (order.trips.length > 0) {
    return order.trips.map((trip) => ({
      specificDestination: trip.specificDestination,
      specificPurpose: trip.specificPurpose,
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
    }));
  }

  if (!order.departureDateIso || !order.returnDateIso) {
    return [];
  }

  const destinationLines = parseMultilineEntries(order.destination);
  const purposeLines = parseMultilineEntries(order.purpose);

  return [
    {
      specificDestination: destinationLines[0] ?? order.destination,
      specificPurpose: purposeLines[0] ?? order.purpose,
      departureDate: order.departureDateIso,
      returnDate: order.returnDateIso,
    },
  ];
}

const MapView = dynamic(
  () =>
    import("@/src/components/shared/map-view").then((module) => ({
      default: module.MapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-xs text-[#7d8598]">
        Loading map...
      </div>
    ),
  },
);

export function RegularTravelOrderDrawer({
  order,
  lookups,
  onUpdate,
  onCancel,
  onClose,
}: Readonly<{
  order: RequesterTravelOrderItem;
  lookups: TravelOrderCreationLookups;
  onUpdate: (formData: FormData) => Promise<void>;
  onCancel: (formData: FormData) => Promise<void>;
  onClose: () => void;
}>) {
  const normalizedStatus = order.status.toUpperCase();
  const isEditable = normalizedStatus === "PENDING";
  const isPrintable = normalizedStatus === "APPROVED";
  const updateFormId = `update-travel-order-${order.id}`;
  const printHref = `/api/travel-orders/${order.id}/print`;
  const [activeEditSection, setActiveEditSection] = useState<EditableSectionId | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const effectiveEditSection = isEditable ? activeEditSection : null;
  const activeEditSectionLabel = effectiveEditSection
    ? EDIT_SECTION_LABELS[effectiveEditSection]
    : "";
  const isInEditMode = effectiveEditSection !== null;
  const tripsJsonValue = useMemo(
    () => JSON.stringify(buildUpdateTripsPayload(order)),
    [order],
  );
  const timelineTrips = useMemo(() => buildTimelineTrips(order), [order]);
  const mapStops = useMemo<readonly MapRouteStop[]>(
    () =>
      timelineTrips.map((trip) => ({
        id: trip.id,
        label: trip.label,
        destination: trip.destination,
        purpose: trip.purpose,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
      })),
    [timelineTrips],
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const activeTripId = useMemo(() => {
    if (timelineTrips.length === 0) {
      return null;
    }

    if (selectedTripId && timelineTrips.some((trip) => trip.id === selectedTripId)) {
      return selectedTripId;
    }

    return timelineTrips[0].id;
  }, [selectedTripId, timelineTrips]);
  const mapMountRef = useRef<HTMLDivElement | null>(null);
  const [shouldMountMap, setShouldMountMap] = useState(
    () =>
      typeof window === "undefined" || typeof window.IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (shouldMountMap) {
      return;
    }

    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      return;
    }

    const node = mapMountRef.current;
    if (!node) {
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMountMap(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "120px",
        threshold: 0.15,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMountMap]);

  const handleActivateEditSection = (sectionId: EditableSectionId) => {
    if (!isEditable) {
      return;
    }

    setActiveEditSection(sectionId);
  };

  const handleDiscardPendingChanges = () => {
    setFormResetKey((previous) => previous + 1);
    setActiveEditSection(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-[#dfe1ed] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#1a1d1f]">Travel Order Details</h2>
              <StatusPill status={order.status} />
            </div>
            <OrderNumberCopy orderNo={order.orderNo} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f] cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
          <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Approval Progress
            </h3>
            <p className="mt-1 text-xs text-[#7d8598]">
              {normalizedStatus === "PENDING"
                ? "Awaiting Step 1 review by first approver."
                : normalizedStatus === "STEP1_APPROVED"
                  ? "Step 1 completed. Awaiting RED/Admin final approval."
                  : normalizedStatus === "APPROVED"
                    ? "Fully approved and ready for printing."
                    : normalizedStatus === "REJECTED"
                      ? "Request was rejected."
                      : normalizedStatus === "RETURNED"
                        ? "Returned to requester for changes."
                        : normalizedStatus === "CANCELLED"
                          ? "Viewing cancelled request."
                          : normalizedStatus === "DRAFT"
                            ? "Still in draft mode."
                            : "Viewing approval workflow status."}
            </p>
            <div className="mt-4 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
              <ApprovalWorkflowTimeline order={order} />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
            <div className="grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Date Posted" value={order.orderDateLabel} />
              <SummaryRow
                label="Travel Dates"
                value={`${order.departureDateLabel} - ${order.returnDateLabel}`}
              />
              <SummaryRow label="Destination" value={order.destination} />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Trip Timeline & Route Map
            </h3>
            <p className="mt-1 text-xs text-[#7d8598]">
              Timeline cards are ordered by date. The map plots recognized destinations.
            </p>

            <div className="mt-3 grid gap-4">
              <div className="overflow-hidden rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <TimelineView
                    trips={timelineTrips}
                    emptyMessage="No trip timeline entries are available for this request."
                    activeTripId={activeTripId}
                    onTripSelect={setSelectedTripId}
                  />
                </div>
              </div>
              <div ref={mapMountRef} className="rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                <p className="mb-3 text-xs text-[#7d8598]">
                  Click a timeline trip or map marker to sync the active location.
                </p>
                {shouldMountMap ? (
                  <MapView
                    stops={mapStops}
                    emptyMessage="No trip destinations are available for mapping."
                    heightClassName="h-[320px] sm:h-[400px]"
                    activeStopId={activeTripId}
                    onStopSelect={setSelectedTripId}
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-xl border border-[#dfe1ed] bg-[#fafbfe] px-3 text-xs text-[#7d8598] sm:h-[400px]">
                    Loading map when this section is in view...
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Details
            </h3>
            {isEditable ? (
              isInEditMode ? (
                <p className="mt-1 text-xs text-[#7d8598]">
                  Editing {activeEditSectionLabel}. Save pending changes when done,
                  or discard to reset all unsaved edits.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#7d8598]">
                  Click Edit on a section to enter edit mode.
                </p>
              )
            ) : null}

            <form
              id={updateFormId}
              key={`update-${order.id}-${formResetKey}`}
              action={onUpdate}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="travelOrderId" value={order.id} />
              <input type="hidden" name="tripsJson" value={tripsJsonValue} />

              <EditableDetailsSection
                title="Travel Details"
                sectionId="travel-details"
                canEdit={isEditable}
                isActive={effectiveEditSection === "travel-details"}
                onEdit={handleActivateEditSection}
              >
                <div className="grid gap-4">
                  <SelectField
                    name="travelTypeId"
                    label="Type of Travel"
                    options={lookups.travelTypes}
                    defaultValue={order.travelTypeId}
                    includeEmptyOption
                    emptyOptionLabel="- Select Type of Travel -"
                    required
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                  <SelectField
                    name="transportationId"
                    label="Means of Transportation"
                    options={lookups.transportations}
                    defaultValue={order.transportationId}
                    includeEmptyOption
                    emptyOptionLabel="- Select Means of Transportation -"
                    required
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                  <SelectField
                    name="programId"
                    label="Program"
                    options={lookups.programs}
                    defaultValue={order.programId}
                    includeEmptyOption
                    emptyOptionLabel="- Select Name of Program/Project -"
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                  <SelectField
                    name="recommendingApproverId"
                    label="Recommending Approver (Step 1)"
                    options={lookups.recommendingApprovers}
                    defaultValue={order.recommendingApproverId}
                    includeEmptyOption
                    emptyOptionLabel="- Select Recommending Approval -"
                    required
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                </div>

                <div className="mt-4 grid gap-4">
                  <InputField
                    name="fundingSource"
                    label="Funding Source"
                    defaultValue={order.fundingSource}
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                  <TextareaField
                    name="remarks"
                    label="Remarks / Special Instructions"
                    rows={2}
                    defaultValue={order.remarks}
                    disabled={!isEditable || effectiveEditSection !== "travel-details"}
                  />
                </div>
              </EditableDetailsSection>

              <EditableDetailsSection
                title="Status & Staff"
                sectionId="staff"
                canEdit={isEditable}
                isActive={effectiveEditSection === "staff"}
                onEdit={handleActivateEditSection}
              >
                <div className="space-y-4">
                  <InputField
                    name="travelStatusRemarks"
                    label="Travel Status Remarks"
                    defaultValue={order.travelStatusRemarks}
                    disabled={!isEditable || effectiveEditSection !== "staff"}
                  />
                  <OtherStaffFields
                    disabled={!isEditable || effectiveEditSection !== "staff"}
                    hasOtherStaffDefault={order.hasOtherStaff}
                  />
                </div>
              </EditableDetailsSection>
            </form>

            {isEditable ? (
              <form
                key={`cancel-${order.id}`}
                action={onCancel}
                className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff7f7] p-3"
              >
                <input type="hidden" name="travelOrderId" value={order.id} />
                <FieldWrapper label="Cancellation Reason (Optional)">
                  <textarea
                    name="cancelReason"
                    rows={2}
                    className="w-full rounded-lg border border-[#ffcece] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#e35e5e] focus:ring-1 focus:ring-[#e35e5e] resize-none"
                    placeholder="Add context for why this pending request is being cancelled"
                  />
                </FieldWrapper>
                <button
                  type="submit"
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-[#E35E5E] px-4 text-sm font-semibold text-white transition hover:bg-[#ca4e4e] cursor-pointer"
                >
                  Cancel Request
                </button>
              </form>
            ) : null}
          </section>
        </div>

        <div className="flex-none border-t border-[#dfe1ed] bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="grid gap-2">
            {isPrintable ? (
              <a
                href={printHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#3B9F41] bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436]"
              >
                Print Travel Order
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#dfe1ed] bg-[#f8f9fc] px-4 text-sm font-semibold text-[#9aa3b8]"
              >
                Print Travel Order
              </button>
            )}

            {isInEditMode ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDiscardPendingChanges}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
                >
                  Discard Pending Changes
                </button>
                <button
                  type="submit"
                  form={updateFormId}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436]"
                >
                  Save Pending Changes
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableDetailsSection({
  title,
  sectionId,
  canEdit,
  isActive,
  onEdit,
  children,
}: Readonly<{
  title: string;
  sectionId: EditableSectionId;
  canEdit: boolean;
  isActive: boolean;
  onEdit: (sectionId: EditableSectionId) => void;
  children: ReactNode;
}>) {
  return (
    <div className="group rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
          {title}
        </p>
        {canEdit ? (
          <button
            type="button"
            onClick={() => onEdit(sectionId)}
            className={`inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 text-xs font-semibold transition ${
              isActive
                ? "border-[#cfe2b1] bg-[#f2f8e8] text-[#42661d]"
                : "border-[#dfe1ed] bg-white text-[#5d6780] hover:bg-[#f3f5fa]"
            }`}
            aria-label={isActive ? `${title} is currently being edited` : `Edit ${title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <p>
      <span className="font-semibold text-[#2f3339]">{label}:</span> {value}
    </p>
  );
}

function FieldWrapper({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">{label}</span>
      {children}
    </label>
  );
}

function InputField({
  name,
  label,
  defaultValue,
  type = "text",
  min,
  max,
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  defaultValue?: string;
  type?: "text" | "date" | "number";
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      />
    </FieldWrapper>
  );
}

function TextareaField({
  name,
  label,
  rows,
  defaultValue,
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  rows: number;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7] resize-none"
      />
    </FieldWrapper>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  disabled,
  includeEmptyOption,
  emptyOptionLabel = "Select an option",
}: Readonly<{
  name: string;
  label: string;
  options: readonly TravelOrderLookupOption[];
  defaultValue?: number | null;
  required?: boolean;
  disabled?: boolean;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
}>) {
  return (
    <FieldWrapper label={label}>
      <select
        name={name}
        required={required}
        disabled={disabled || options.length === 0}
        defaultValue={
          defaultValue != null
            ? String(defaultValue)
            : includeEmptyOption
              ? ""
              : String(options[0]?.id ?? "")
        }
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      >
        {includeEmptyOption ? (
          <option value="">{emptyOptionLabel}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

function StatusPill({ status }: Readonly<{ status: string }>) {
  const normalized = status.toUpperCase();
  const styles =
    normalized === "REJECTED" || normalized === "CANCELLED"
      ? "bg-[#FFB1B1] text-[#E35E5E]"
      : normalized === "APPROVED" || normalized === "STEP1_APPROVED"
        ? "bg-[#B3FBD2] text-[#26AF5D]"
        : normalized === "RETURNED"
          ? "bg-[#FFE7B3] text-[#B57900]"
          : "bg-[#FEF6D2] text-[#C9AF37]";

  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {formatStatusLabel(normalized)}
    </span>
  );
}

function formatStatusLabel(normalizedStatus: string): string {
  return normalizedStatus
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
