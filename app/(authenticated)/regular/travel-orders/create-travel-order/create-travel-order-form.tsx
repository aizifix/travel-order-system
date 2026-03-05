"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { FormSectionSkeleton } from "@/src/components/ui/skeleton";
import { SelectField } from "@/src/components/ui/select-field";

type FieldError = {
  field: string;
  message: string;
};

const TravelScheduleFields = dynamic(
  () => import("@/src/components/regular/travel-orders/travel-order-schedule-and-staff-fields").then((mod) => ({ default: mod.TravelScheduleFields })),
  {
    loading: () => <FormSectionSkeleton fields={3} />,
    ssr: false,
  }
);

const OtherStaffFields = dynamic(
  () => import("@/src/components/regular/travel-orders/travel-order-schedule-and-staff-fields").then((mod) => ({ default: mod.OtherStaffFields })),
  {
    loading: () => <FormSectionSkeleton fields={2} />,
    ssr: false,
  }
);

const STORAGE_KEY = "travel-order-draft";

type TravelOrderLookupOption = Readonly<{
  id: number;
  name: string;
}>;

type CreateTravelOrderLookups = Readonly<{
  travelTypes: readonly TravelOrderLookupOption[];
  transportations: readonly TravelOrderLookupOption[];
  programs: readonly TravelOrderLookupOption[];
  recommendingApprovers: readonly TravelOrderLookupOption[];
}>;

type LookupsApiResponse = Readonly<{
  lookups: CreateTravelOrderLookups;
  hasRequiredLookups: boolean;
}>;

function useUnsavedChanges(hasUnsavedChanges: boolean, onDiscard: () => void) {
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleNavigation = useCallback(
    (action: () => void) => {
      if (hasUnsavedChanges) {
        setPendingAction(() => action);
        setShowModal(true);
      } else {
        action();
      }
    },
    [hasUnsavedChanges]
  );

  const handleDiscard = () => {
    onDiscard();
    setShowModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingAction(null);
  };

  return { showModal, handleNavigation, handleDiscard, handleCancel };
}

export default function CreateTravelOrderForm({
  dateFiledLabel,
  profile,
  profileReady,
  initialError,
}: Readonly<{
  dateFiledLabel: string;
  profile: {
    fullName: string;
    divisionName: string | null;
    positionName: string | null;
    designationName: string | null;
    employmentStatusName: string | null;
  } | null;
  profileReady: boolean;
  initialError?: string | null;
}>) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [restoredDraftPresent, setRestoredDraftPresent] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Record<string, string | boolean> | null>(null);
  const [lookups, setLookups] = useState<CreateTravelOrderLookups | null>(null);
  const [hasRequiredLookups, setHasRequiredLookups] = useState(false);
  const [lookupsState, setLookupsState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const lookupsRequestInFlightRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = "create-travel-order-form";

  // Field-level error state
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<{
    travelType: string;
    transportation: string;
    program: string;
    recommendingApprover: string;
    objectives: string;
    fundingSource: string;
    remarks: string;
    tripsJson: string;
    hasOtherStaff: boolean;
  } | null>(null);

  // Helper function to get error for a specific field
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const error = fieldErrors.find(e => e.field === fieldName);
    return error?.message;
  }, [fieldErrors]);

  // Collect form data for review modal
  const collectReviewData = useCallback(() => {
    if (!formRef.current || !lookups) return null;

    const formData = new FormData(formRef.current);

    const getSelectLabel = (name: string, options: readonly TravelOrderLookupOption[]) => {
      const value = formData.get(name);
      const option = options.find(o => o.id.toString() === value);
      return option?.name || "Not selected";
    };

    const tripsJsonInput = formRef.current.querySelector('[name="tripsJson"]') as HTMLInputElement | null;
    const hasOtherStaffCheckbox = formRef.current.querySelector('[name="hasOtherStaff"]') as HTMLInputElement | null;

    return {
      travelType: getSelectLabel("travelTypeId", lookups.travelTypes),
      transportation: getSelectLabel("transportationId", lookups.transportations),
      program: getSelectLabel("programId", lookups.programs),
      recommendingApprover: getSelectLabel("recommendingApproverId", lookups.recommendingApprovers),
      objectives: formData.get("objectives") as string || "",
      fundingSource: formData.get("fundingSource") as string || "",
      remarks: formData.get("remarks") as string || "",
      tripsJson: tripsJsonInput?.value || "[]",
      hasOtherStaff: hasOtherStaffCheckbox?.checked || false,
    };
  }, [lookups]);

  // Handle submit for approval button click - show review modal
  const handleSubmitForApprovalClick = useCallback(() => {
    const data = collectReviewData();
    setReviewData(data);
    setShowReviewModal(true);
  }, [collectReviewData]);

  // Handle confirm submission from review modal
  const handleConfirmSubmission = useCallback(() => {
    setShowReviewModal(false);
    // Programmatically submit the form with actionType="submit"
    const form = formRef.current;
    if (form) {
      const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, "target", { value: form });
      // Set the actionType to submit
      const actionInput = document.createElement("input");
      actionInput.type = "hidden";
      actionInput.name = "actionType";
      actionInput.value = "submit";
      form.appendChild(actionInput);
      form.dispatchEvent(submitEvent);
      form.removeChild(actionInput);
    }
  }, []);

  // Handle go back to edit from review modal
  const handleGoBackToEdit = useCallback(() => {
    setShowReviewModal(false);
  }, []);

  const hasBlockingProfileIssue = !profileReady;
  const hasBlockingLookupIssue = lookupsState === "ready" && !hasRequiredLookups;
  const canEdit = !hasBlockingProfileIssue && !hasBlockingLookupIssue;
  const canSubmit = canEdit && lookupsState === "ready";

  const loadLookups = useCallback(async () => {
    if (lookupsState === "ready" || lookupsRequestInFlightRef.current) {
      return;
    }

    lookupsRequestInFlightRef.current = true;
    setLookupsState("loading");
    setLookupsError(null);

    try {
      const response = await fetch("/api/regular/travel-orders/create-lookups", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as LookupsApiResponse;
      setLookups(payload.lookups);
      setHasRequiredLookups(payload.hasRequiredLookups);
      setLookupsState("ready");
    } catch (error) {
      console.error("Failed to load create travel order lookups", error);
      setLookupsState("error");
      setLookupsError("Unable to load travel options. Please try again.");
    } finally {
      lookupsRequestInFlightRef.current = false;
    }
  }, [lookupsState]);

  const { showModal, handleNavigation, handleDiscard, handleCancel } =
    useUnsavedChanges(isDirty || restoredDraftPresent, () => {
      localStorage.removeItem(STORAGE_KEY);
      setRestoredDraftPresent(false);
      setIsDirty(false);
    });

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (!savedDraft) {
      return;
    }

    setRestoredDraftPresent(true);

    try {
      const parsedDraft = JSON.parse(savedDraft) as Record<string, string | boolean>;
      setPendingDraft(parsedDraft);
    } catch (e) {
      console.error("Failed to load draft:", e);
      setPendingDraft(null);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (!pendingDraft || !formRef.current) {
      return;
    }

    Object.entries(pendingDraft).forEach(([key, value]) => {
      const element = formRef.current?.querySelector(
        `[name="${key}"]`
      ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!element) {
        return;
      }

      if (element.type === "checkbox") {
        (element as HTMLInputElement).checked = value === true;
        return;
      }

      element.value = String(value);
    });

    setPendingDraft(null);
  }, [pendingDraft]);

  const handleFormChange = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const draft: Record<string, string | boolean> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        draft[key] = value;
      }
    });

    const hasOtherStaffCheckbox = formRef.current.querySelector(
      '[name="hasOtherStaff"]'
    ) as HTMLInputElement | null;
    if (hasOtherStaffCheckbox) {
      draft.hasOtherStaff = hasOtherStaffCheckbox.checked;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setIsDirty(true);
    setRestoredDraftPresent(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (lookupsState !== "ready") {
        event.preventDefault();
        void loadLookups();
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);

      // Get trips from the hidden input
      const tripsJsonInput = form.querySelector('[name="tripsJson"]') as HTMLInputElement | null;
      if (tripsJsonInput) {
        formData.set("tripsJson", tripsJsonInput.value);
      }

      setIsSubmitting(true);
      setFieldErrors([]);
      setGeneralError(null);

      try {
        const response = await fetch("/api/regular/travel-orders/create", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.errors && Array.isArray(result.errors)) {
            setFieldErrors(result.errors);

            // Scroll to first error
            const firstError = result.errors[0];
            if (firstError) {
              const errorElement = form.querySelector(`[name="${firstError.field}"]`) ||
                form.querySelector('[name="tripsJson"]');
              if (errorElement) {
                errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }
          } else {
            setGeneralError(result.errors?.[0]?.message || "An error occurred. Please try again.");
          }
          return;
        }

        // Success - clear draft and redirect
        localStorage.removeItem(STORAGE_KEY);
        router.push(result.redirectUrl || "/regular/travel-orders");
      } catch (error) {
        console.error("Form submission error:", error);
        setGeneralError("An unexpected error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadLookups, lookupsState, router],
  );

  const handleBack = () => {
    handleNavigation(() => {
      router.push("/regular/travel-orders");
    });
  };

  return (
    <div className="space-y-4">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleCancel}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#2f3339]">
              Unsaved changes
            </h3>
            <p className="mt-2 text-sm text-[#5d6780]">
              You have unsaved changes. Would you like to save them before
              leaving?
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                form={formId}
                name="actionType"
                value="draft"
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436]"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 py-2.5 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleGoBackToEdit}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#2f3339]">
              Review
            </h3>
            <p className="mt-1 text-sm text-[#5d6780]">
              Please review your travel order details before submitting.
            </p>

            <div className="mt-6 space-y-4">
              {/* Travel Details Section */}
              <div className="rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                  Travel Details
                </h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ReviewField label="Type of Travel" value={reviewData.travelType} />
                  <ReviewField label="Means of Transportation" value={reviewData.transportation} />
                  <ReviewField label="Name of Program/Project" value={reviewData.program} />
                  <ReviewField label="Recommending Approval (Step 1)" value={reviewData.recommendingApprover} />
                </div>
              </div>

              {/* Objectives and Funding */}
              <div className="rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                  Objectives & Funding
                </h4>
                <div className="mt-3 space-y-3">
                  <ReviewField label="Objective(s)" value={reviewData.objectives || "-"} />
                  <ReviewField label="Funding Source" value={reviewData.fundingSource || "-"} />
                  <ReviewField label="Remarks / Special Instructions" value={reviewData.remarks || "-"} />
                </div>
              </div>

              {/* Trips Section */}
              <div className="rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                  Trip Destinations
                </h4>
                <div className="mt-3">
                  <TripsReview tripsJson={reviewData.tripsJson} />
                </div>
              </div>

              {/* Other Staff */}
              {reviewData.hasOtherStaff && (
                <div className="rounded-lg border border-[#dfe1ed] bg-[#fafbfe] p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
                    Other Staff
                  </h4>
                  <p className="mt-2 text-sm text-[#2f3339]">
                    Additional staff members are included in this travel order.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleGoBackToEdit}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 py-2.5 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Go back to edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                disabled={isSubmitting}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#3B9F41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#359436] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleBack}
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#5d6780] transition hover:text-[#2f3339]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Travel Orders
      </button>

      <section className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
        <p className="text-sm text-[#5d6780]">
          Fill in the required fields. Submit sends your request to the
          recommending approver (step 1), then RED/Admin handles final approval
          (step 2).
        </p>

        {initialError || generalError ? (
          <div className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
            {generalError || initialError}
          </div>
        ) : null}

        {hasBlockingProfileIssue ? (
          <div className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
            Your account is missing required profile details (division or
            employment status). Contact an administrator before creating a
            travel order.
          </div>
        ) : null}

        {!hasBlockingProfileIssue && hasBlockingLookupIssue ? (
          <div className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
            Required lookup data is missing (travel type, transportation, or
            recommending approver). Contact an administrator before creating a
            travel order.
          </div>
        ) : null}

        {!hasBlockingProfileIssue && lookupsState === "error" ? (
          <div className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
            {lookupsError}
          </div>
        ) : null}

        <form
          id={formId}
          ref={formRef}
          className="mt-6 space-y-6"
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          noValidate
        >
          <RequesterDetailsSection
            dateFiledLabel={dateFiledLabel}
            profile={profile}
          />

          {lookupsState === "loading" || lookupsState === "idle" ? (
            <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
              <FormSectionSkeleton fields={6} />
            </section>
          ) : null}

          {lookupsState === "error" ? (
            <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
              <p className="text-sm text-[#a33a3a]">
                {lookupsError ?? "Unable to load travel options."}
              </p>
              <button
                type="button"
                onClick={() => {
                  void loadLookups();
                }}
                className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Retry loading options
              </button>
            </section>
          ) : null}

          {lookupsState === "ready" && lookups ? (
            <TravelDetailsSection
              disabled={!canEdit}
              lookups={lookups}
              fieldErrors={fieldErrors}
            />
          ) : null}

          <ScheduleStatusSection
            disabled={!canEdit}
            tripError={getFieldError("trips")}
          />

          <AttachmentsSection disabled={!canEdit} />

          {!canSubmit ? (
            <p className="text-xs text-[#7d8598]">
              Please wait for travel details to load before submitting.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              name="actionType"
              value="draft"
              disabled={!canEdit || isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmitForApprovalClick}
              disabled={!canEdit || isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RequesterDetailsSection({
  dateFiledLabel,
  profile,
}: Readonly<{
  dateFiledLabel: string;
  profile: {
    fullName: string;
    divisionName: string | null;
    positionName: string | null;
    designationName: string | null;
    employmentStatusName: string | null;
  } | null;
}>) {
  return (
    <section className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
        Requester Details
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ReadOnlyField label="Date Filed" value={dateFiledLabel} />
        <ReadOnlyField label="Name" value={profile?.fullName ?? "-"} />
        <ReadOnlyField
          label="Division | Unit"
          value={profile?.divisionName ?? "No Division Assigned"}
        />
        <ReadOnlyField
          label="Place of Assignment"
          value={profile?.divisionName ?? "No Division Assigned"}
        />
        <ReadOnlyField
          label="Position"
          value={profile?.positionName ?? "No Position Assigned"}
        />
        <ReadOnlyField
          label="Designation"
          value={profile?.designationName ?? "No Designation Assigned"}
        />
        <ReadOnlyField
          label="Employment Status"
          value={
            profile?.employmentStatusName ?? "No Employment Status Assigned"
          }
        />
      </div>
    </section>
  );
}

function TravelDetailsSection({
  lookups,
  disabled,
  fieldErrors,
}: Readonly<{
  lookups: CreateTravelOrderLookups;
  disabled: boolean;
  fieldErrors: FieldError[];
}>) {
  const getError = (field: string) => fieldErrors.find(e => e.field === field)?.message;

  return (
    <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
        Travel Details
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <SelectField
          name="travelTypeId"
          label="Type of Travel"
          options={lookups.travelTypes}
          includeEmptyOption
          emptyOptionLabel="- Select Type of Travel -"
          disabled={disabled}
          error={getError("travelTypeId")}
        />
        <SelectField
          name="transportationId"
          label="Means of Transportation"
          options={lookups.transportations}
          includeEmptyOption
          emptyOptionLabel="- Select Means of Transportation -"
          disabled={disabled}
          error={getError("transportationId")}
        />
        <SelectField
          name="programId"
          label="Name of Program/Project"
          options={lookups.programs}
          includeEmptyOption
          emptyOptionLabel="- Select Name of Program/Project -"
          disabled={disabled}
          error={getError("programId")}
        />
        <SelectField
          name="recommendingApproverId"
          label="Recommending Approval (Step 1)"
          options={lookups.recommendingApprovers}
          includeEmptyOption
          emptyOptionLabel="- Select Recommending Approval -"
          disabled={disabled}
          error={getError("recommendingApproverId")}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextareaField
          name="objectives"
          label="Objective(s)"
          rows={3}
          maxLength={120}
          disabled={disabled}
          error={getError("objectives")}
        />
        <InputField
          name="fundingSource"
          label="Funding Source"
          placeholder="e.g. DA Region 10 Program Budget"
          maxLength={120}
          disabled={disabled}
          error={getError("fundingSource")}
        />
        <TextareaField
          name="remarks"
          label="Remarks / Special Instructions"
          rows={3}
          maxLength={120}
          disabled={disabled}
          error={getError("remarks")}
        />
      </div>
      <p className="mt-3 text-xs text-[#7d8598]">
        Specific destination and purpose are captured in the Trip Destinations
        section below.
      </p>
    </section>
  );
}

function AttachmentsSection({
  disabled,
}: Readonly<{
  disabled: boolean;
}>) {
  return (
    <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
        Attachments
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <FileField
          name="supportingLetterPdf"
          label="Upload Letter in PDF"
          accept=".pdf,application/pdf"
          disabled={disabled}
        />
      </div>
    </section>
  );
}

function ScheduleStatusSection({
  disabled,
  tripError,
}: Readonly<{
  disabled: boolean;
  tripError?: string;
}>) {
  return (
    <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
        Schedule & Status
      </h3>
      <div className="mt-3">
        <TravelScheduleFields disabled={disabled} />
      </div>

      {tripError && (
        <div className="mt-3 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
          {tripError}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <InputField
          name="travelStatusRemarks"
          label="Travel Status Remarks"
          placeholder="Optional remarks about current status"
          maxLength={120}
          disabled={disabled}
        />
        <OtherStaffFields disabled={disabled} />
      </div>
    </section>
  );
}

function FieldWrapper({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#4a5266]">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <FieldWrapper label={label}>
      <div className="min-h-10 rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339]">
        {value}
      </div>
    </FieldWrapper>
  );
}

function InputField({
  name,
  label,
  placeholder,
  type = "text",
  min,
  max,
  maxLength,
  required,
  disabled,
  error,
}: Readonly<{
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "date" | "number";
  min?: number;
  max?: number;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>) {
  const hasError = Boolean(error);

  return (
    <FieldWrapper label={label}>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-all
          ${hasError
            ? "border-[#dc2626] ring-1 ring-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]"
            : "border-[#dfe1ed] focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
          }
          disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]`}
      />
      {error && <p className="mt-1 text-xs text-[#dc2626]">{error}</p>}
    </FieldWrapper>
  );
}

function FileField({
  name,
  label,
  accept,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  accept?: string;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <input
        type="file"
        name={name}
        accept={accept}
        disabled={disabled}
        className="block w-full rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] file:mr-3 file:rounded-md file:border-0 file:bg-[#f3f5fa] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#4a5266] hover:file:bg-[#e9edf6] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      />
      <p className="mt-1 text-xs text-[#7d8598]">
        Optional. PDF only, up to 10 MB.
      </p>
    </FieldWrapper>
  );
}

function TextareaField({
  name,
  label,
  rows,
  required,
  disabled,
  maxLength,
  error,
}: Readonly<{
  name: string;
  label: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  error?: string;
}>) {
  const [charCount, setCharCount] = useState(0);
  const hasError = Boolean(error);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
  };

  return (
    <FieldWrapper label={label}>
      <div className="relative">
        <textarea
          name={name}
          rows={rows}
          required={required}
          disabled={disabled}
          onChange={handleChange}
          maxLength={maxLength}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-all resize-none
            ${hasError
              ? "border-[#dc2626] ring-1 ring-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]"
              : "border-[#dfe1ed] focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41]"
            }
            disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]`}
        />
        {maxLength ? (
          <div
            className={`mt-1 text-xs ${
              charCount > maxLength
                ? "text-red-500"
                : charCount > maxLength * 0.9
                  ? "text-amber-500"
                  : "text-[#7d8598]"
            }`}
          >
            {charCount}/{maxLength} characters
          </div>
        ) : null}
        {error && <p className="mt-1 text-xs text-[#dc2626]">{error}</p>}
      </div>
    </FieldWrapper>
  );
}

// Review modal helper components
function ReviewField({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-[#7d8598]">{label}</span>
      <div className="rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339]">
        {value || "-"}
      </div>
    </div>
  );
}

function TripsReview({
  tripsJson,
}: Readonly<{
  tripsJson: string;
}>) {
  const trips = useMemo(() => {
    try {
      return JSON.parse(tripsJson) as Array<{
        dateFrom: string;
        dateTo: string;
        destination: string;
        purpose: string;
      }>;
    } catch {
      return [];
    }
  }, [tripsJson]);

  if (!trips || trips.length === 0) {
    return (
      <p className="text-sm text-[#5d6780]">No trips added.</p>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((trip, index) => (
        <div key={index} className="rounded-lg border border-[#dfe1ed] bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#2f3339]">Trip {index + 1}</span>
            <span className="text-xs text-[#7d8598]">
              {trip.dateFrom} - {trip.dateTo}
            </span>
          </div>
          <div className="mt-2">
            <span className="block text-xs font-medium text-[#7d8598]">Destination</span>
            <span className="text-sm text-[#2f3339]">{trip.destination || "-"}</span>
          </div>
          <div className="mt-2">
            <span className="block text-xs font-medium text-[#7d8598]">Purpose</span>
            <span className="text-sm text-[#2f3339]">{trip.purpose || "-"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
