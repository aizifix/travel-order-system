"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { X, Check, RotateCcw } from "lucide-react";
import type {
  AdminTravelOrderItem,
  RequesterTravelOrderStep,
  TravelOrderApprovalAction,
} from "@/src/server/travel-orders/service";
import { ApprovalWorkflowTimeline } from "@/src/components/travel-orders/approval-workflow-timeline";
import { OrderNumberCopy } from "@/src/components/travel-orders/order-number-copy";
import { RequesterAvatar } from "@/src/components/travel-orders/requester-avatar";
import {
  TimelineView,
  type TimelineTripItem,
} from "@/src/components/shared/timeline-view";
import type { MapRouteStop } from "@/src/components/shared/map-view";

const ONE_DAY_MS = 86_400_000;

type StepTone = "success" | "pending" | "danger" | "muted";

type StepVisualState = Readonly<{
  label: string;
  tone: StepTone;
  summary: string;
}>;

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

function buildTimelineTrips(order: AdminTravelOrderItem): readonly TimelineTripItem[] {
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

export function AdminTravelOrderDrawer({
  order,
  onReview,
  onClose,
}: Readonly<{
  order: AdminTravelOrderItem;
  onReview: (formData: FormData) => Promise<void>;
  onClose: () => void;
}>) {
  const normalizedStatus = order.status.toUpperCase();
  const readyForFinalReview = normalizedStatus === "STEP1_APPROVED";
  const isPrintable = normalizedStatus === "APPROVED";
  const printHref = `/api/travel-orders/${order.id}/print`;
  const editHref = `/admin/travel-orders/${order.id}/edit`;
  const approveFormId = `admin-step2-approve-${order.id}`;
  const returnFormId = `admin-step2-return-${order.id}`;
  const rejectFormId = `admin-step2-reject-${order.id}`;
  const reviewActionButtonBaseClass =
    "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const approveActionButtonClass = `${reviewActionButtonBaseClass} border-[#2f8f3a] bg-[#2f8f3a] text-white hover:border-[#267530] hover:bg-[#267530] focus-visible:ring-[#2f8f3a]`;
  const returnActionButtonClass = `${reviewActionButtonBaseClass} border-[#d8a347] bg-[#fff9ed] text-[#8a5b00] hover:bg-[#fff2da] focus-visible:ring-[#d8a347]`;
  const rejectActionButtonClass = `${reviewActionButtonBaseClass} border-[#e35e5e] bg-[#fff7f7] text-[#a33a3a] hover:bg-[#ffeaea] focus-visible:ring-[#e35e5e]`;
  const step1State = getStepVisualState(order, order.step1);
  const step2State = getStepVisualState(order, order.step2);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-none border-b border-[#dfe1ed] px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <RequesterAvatar fullName={order.requestedBy} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1a1d1f]">Travel Order Details</h2>
                <StatusPill status={order.status} />
              </div>
              <p className="mt-0.5 text-sm font-medium text-[#5d6780]">{order.requestedBy}</p>
              <OrderNumberCopy orderNo={order.orderNo} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
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
              {readyForFinalReview
                ? "Step 1 is complete. Final admin action is required."
                : normalizedStatus === "APPROVED"
                  ? "Final review completed. This travel order is approved."
                  : normalizedStatus === "REJECTED"
                    ? "Final review completed with rejection."
                    : normalizedStatus === "RETURNED"
                      ? "Final review completed and returned to requester."
                      : "Waiting for step 1 approver to complete review."}
            </p>
            <div className="mt-4 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
              <ApprovalWorkflowTimeline order={order} />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Requester Information
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <RequesterAvatar fullName={order.requestedBy} />
              <div>
                <p className="font-semibold text-[#2f3339]">{order.requestedBy}</p>
                <p className="text-xs text-[#7d8598]">{order.division ?? "No Division"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Date Posted" value={order.orderDateLabel} />
              <SummaryRow
                label="Travel Dates"
                value={`${order.departureDateLabel} - ${order.returnDateLabel}`}
              />
              <SummaryRow label="Destination" value={order.destination} />
              <SummaryRow label="Funding Source" value={order.fundingSource || "-"} />
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
              Additional Details
            </h3>
            <div className="mt-3 grid gap-3 text-sm text-[#4a5266] sm:grid-cols-2">
              <SummaryRow label="Travel Days" value={String(order.travelDays)} />
              <SummaryRow
                label="Includes Other Staff"
                value={order.hasOtherStaff ? "Yes" : "No"}
              />
              <SummaryRow
                label="Travel Status Remarks"
                value={order.travelStatusRemarks || "-"}
              />
            </div>
            <div className="mt-3 rounded-lg border border-[#dfe1ed] bg-[#fafbfe] px-3 py-2 text-sm text-[#4a5266]">
              <p className="font-semibold text-[#2f3339]">Remarks / Special Instructions</p>
              <p className="mt-1 whitespace-pre-wrap">{order.remarks || "-"}</p>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Approval Details
            </h3>
            <div className="mt-4 space-y-3">
              <ApprovalStepCard
                stepLabel="Step 1 - First Approver"
                expectedApproverName={order.step1.expectedApproverName}
                step={order.step1}
                visual={step1State}
              />
              <ApprovalStepCard
                stepLabel="Step 2 - RED/Admin"
                expectedApproverName={order.step2.expectedApproverName}
                step={order.step2}
                visual={step2State}
              />
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-[#dfe1ed] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
              Step 2 Review Actions
            </h3>
            {readyForFinalReview ? (
              <div className="mt-3 space-y-3">
                <form
                  id={approveFormId}
                  action={onReview}
                  className="rounded-lg border border-[#dfe1ed] p-3"
                >
                  <input type="hidden" name="travelOrderId" value={order.id} />
                  <input type="hidden" name="action" value="APPROVED" />
                  <FieldWrapper label="Approval Notes (Optional)">
                    <textarea
                      name="remarks"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
                      placeholder="Optional context for final approval"
                    />
                  </FieldWrapper>
                </form>

                <form
                  id={returnFormId}
                  action={onReview}
                  className="rounded-lg border border-[#ffe2a8] bg-[#fff9ed] p-3"
                >
                  <input type="hidden" name="travelOrderId" value={order.id} />
                  <input type="hidden" name="action" value="RETURNED" />
                  <FieldWrapper label="Return Reason">
                    <textarea
                      name="remarks"
                      rows={3}
                      required
                      className="w-full resize-none rounded-lg border border-[#ffd591] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#d8a347] focus:ring-1 focus:ring-[#d8a347]"
                      placeholder="State what needs to be revised before resubmission"
                    />
                  </FieldWrapper>
                </form>

                <form
                  id={rejectFormId}
                  action={onReview}
                  className="rounded-lg border border-[#ffcece] bg-[#fff7f7] p-3"
                >
                  <input type="hidden" name="travelOrderId" value={order.id} />
                  <input type="hidden" name="action" value="REJECTED" />
                  <FieldWrapper label="Rejection Reason">
                    <textarea
                      name="remarks"
                      rows={3}
                      required
                      className="w-full resize-none rounded-lg border border-[#ffcece] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#e35e5e] focus:ring-1 focus:ring-[#e35e5e]"
                      placeholder="State the reason for rejection"
                    />
                  </FieldWrapper>
                </form>
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-[#dfe1ed] bg-[#f8f9fc] px-3 py-2 text-sm text-[#5d6780]">
                {normalizedStatus === "PENDING"
                  ? "Step 1 approver must approve this request first."
                  : "Final review is already complete for this travel order."}
              </p>
            )}
          </section>
        </div>

        <div className="flex-none border-t border-[#dfe1ed] bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="grid gap-2 sm:grid-cols-2">
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

            <a
              href={editHref}
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
            >
              Edit Travel Order
            </a>
          </div>

          {readyForFinalReview ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button
                type="submit"
                form={approveFormId}
                className={approveActionButtonClass}
              >
                <Check className="h-4 w-4" />
                Approve
              </button>

              <button
                type="submit"
                form={returnFormId}
                className={returnActionButtonClass}
              >
                <RotateCcw className="h-4 w-4" />
                Return
              </button>

              <button
                type="submit"
                form={rejectFormId}
                className={rejectActionButtonClass}
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </div>
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

function ApprovalStepCard({
  stepLabel,
  expectedApproverName,
  step,
  visual,
}: Readonly<{
  stepLabel: string;
  expectedApproverName: string | null;
  step: RequesterTravelOrderStep;
  visual: StepVisualState;
}>) {
  return (
    <article className={`rounded-lg border p-3 ${getStepToneClasses(visual.tone)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{stepLabel}</h4>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
          {visual.label}
        </span>
      </div>
      <p className="mt-1 text-xs">{visual.summary}</p>
      {expectedApproverName ? <p className="mt-1 text-xs">Expected approver: {expectedApproverName}</p> : null}
      {step.actionAtLabel ? <p className="mt-1 text-xs">Updated: {step.actionAtLabel}</p> : null}
      {step.remarks ? <p className="mt-1 text-xs">Remarks: {step.remarks}</p> : null}
    </article>
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

function getStepVisualState(
  order: AdminTravelOrderItem,
  step: RequesterTravelOrderStep,
): StepVisualState {
  if (step.action) {
    return {
      label: formatActionLabel(step.action),
      tone: getActionTone(step.action),
      summary: step.actedByName
        ? `${formatActionLabel(step.action)} by ${step.actedByName}`
        : formatActionLabel(step.action),
    };
  }

  const normalizedStatus = order.status.toUpperCase();

  if (step.stepNo === 1) {
    if (normalizedStatus === "PENDING") {
      return {
        label: "Pending",
        tone: "pending",
        summary: "Awaiting first approver review.",
      };
    }
    if (normalizedStatus === "STEP1_APPROVED" || normalizedStatus === "APPROVED") {
      return {
        label: "Approved",
        tone: "success",
        summary: "Step 1 completed and forwarded.",
      };
    }
    if (normalizedStatus === "REJECTED") {
      return {
        label: "Rejected",
        tone: "danger",
        summary: "Request was rejected.",
      };
    }
    if (normalizedStatus === "RETURNED") {
      return {
        label: "Returned",
        tone: "pending",
        summary: "Request was returned for requester updates.",
      };
    }
  }

  if (step.stepNo === 2) {
    if (normalizedStatus === "PENDING") {
      return { label: "Waiting", tone: "muted", summary: "Waiting for step 1 approval." };
    }
    if (normalizedStatus === "STEP1_APPROVED") {
      return { label: "Pending", tone: "pending", summary: "Ready for final review." };
    }
    if (normalizedStatus === "APPROVED") {
      return { label: "Approved", tone: "success", summary: "Final approval completed." };
    }
    if (normalizedStatus === "REJECTED") {
      return { label: "Rejected", tone: "danger", summary: "Final review rejected." };
    }
    if (normalizedStatus === "RETURNED") {
      return { label: "Returned", tone: "pending", summary: "Returned at final review." };
    }
  }

  return {
    label: "Not Started",
    tone: "muted",
    summary: "No final-step action recorded yet.",
  };
}

function getActionTone(action: TravelOrderApprovalAction): StepTone {
  if (action === "APPROVED") return "success";
  if (action === "RETURNED") return "pending";
  return "danger";
}

function formatActionLabel(action: TravelOrderApprovalAction): string {
  if (action === "RETURNED") return "Returned";
  if (action === "REJECTED") return "Rejected";
  return "Approved";
}

function getStepToneClasses(tone: StepTone): string {
  if (tone === "success") return "border-[#cdeedb] bg-[#f1fbf5] text-[#1f7d42]";
  if (tone === "danger") return "border-[#ffcece] bg-[#fff3f3] text-[#a33a3a]";
  if (tone === "pending") return "border-[#ffe4b5] bg-[#fff9ed] text-[#8a5b00]";
  return "border-[#dfe1ed] bg-[#f8f9fc] text-[#5d6780]";
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
  const parts = normalizedStatus.toLowerCase().split("_");
  const capitalized = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return capitalized.join(" ");
}
