"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { FormSectionSkeleton } from "@/src/components/ui/skeleton";
import { SelectField } from "@/src/components/ui/select-field";

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
  onSubmit,
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
  onSubmit: (formData: FormData) => Promise<void>;
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
    (event: React.FormEvent<HTMLFormElement>) => {
      if (lookupsState !== "ready") {
        event.preventDefault();
        void loadLookups();
      }
    },
    [loadLookups, lookupsState],
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

        {initialError ? (
          <div className="mt-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
            {initialError}
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
          action={onSubmit}
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
            />
          ) : null}

          <AttachmentsSection disabled={!canEdit} />

          <ScheduleStatusSection disabled={!canEdit} />

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
              disabled={!canEdit}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 text-sm font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              name="actionType"
              value="submit"
              disabled={!canEdit}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Submit for Approval
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
}: Readonly<{
  lookups: CreateTravelOrderLookups;
  disabled: boolean;
}>) {
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
        />
        <SelectField
          name="transportationId"
          label="Means of Transportation"
          options={lookups.transportations}
          includeEmptyOption
          emptyOptionLabel="- Select Means of Transportation -"
          disabled={disabled}
        />
        <SelectField
          name="programId"
          label="Name of Program/Project"
          options={lookups.programs}
          includeEmptyOption
          emptyOptionLabel="- Select Name of Program/Project -"
          disabled={disabled}
        />
        <SelectField
          name="recommendingApproverId"
          label="Recommending Approval (Step 1)"
          options={lookups.recommendingApprovers}
          includeEmptyOption
          emptyOptionLabel="- Select Recommending Approval -"
          disabled={disabled}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextareaField
          name="locationVenue"
          label="Location / Venue"
          rows={3}
          disabled={disabled}
        />
        <TextareaField
          name="objectives"
          label="Objective(s)"
          rows={3}
          maxLength={120}
          disabled={disabled}
        />
        <InputField
          name="fundingSource"
          label="Funding Source"
          placeholder="e.g. DA Region 10 Program Budget"
          disabled={disabled}
        />
        <TextareaField
          name="remarks"
          label="Remarks / Special Instructions"
          rows={3}
          disabled={disabled}
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
}: Readonly<{
  disabled: boolean;
}>) {
  return (
    <section className="rounded-xl border border-[#dfe1ed] bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6780]">
        Schedule & Status
      </h3>
      <div className="mt-3">
        <TravelScheduleFields disabled={disabled} />
      </div>

      <div className="mt-4 space-y-4">
        <InputField
          name="travelStatusRemarks"
          label="Travel Status Remarks"
          placeholder="Optional remarks about current status"
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
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  placeholder?: string;
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
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
      />
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
}: Readonly<{
  name: string;
  label: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}>) {
  const [charCount, setCharCount] = useState(0);

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
          className="w-full rounded-lg border border-[#dfe1ed] bg-white px-3 py-2 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7] resize-none"
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
      </div>
    </FieldWrapper>
  );
}
