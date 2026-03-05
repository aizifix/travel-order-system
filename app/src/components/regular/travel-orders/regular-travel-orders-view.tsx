"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type {
  RequesterTravelOrderItem,
  TravelOrderCreationLookups,
  TravelOrderPagination,
  TravelOrderRequesterProfile,
  TravelOrderSortColumn,
  TravelOrderSortDirection,
} from "@/src/server/travel-orders/service";
import { TableSkeleton } from "@/src/components/ui/skeleton";

// Lazy load the heavy table component
const RegularTravelOrdersTable = dynamic(
  () => import("@/src/components/regular/travel-orders/regular-travel-orders-table").then((mod) => ({ default: mod.RegularTravelOrdersTable })),
  {
    loading: () => <TableSkeleton rows={6} columns={8} />,
    ssr: false,
  }
);

type CurrentFilter = Readonly<{
  search?: string;
  status?: string;
  sortBy?: TravelOrderSortColumn;
  sortDir?: TravelOrderSortDirection;
  page?: number;
  limit?: number;
}>;

type RegularTravelOrdersViewProps = Readonly<{
  profile: TravelOrderRequesterProfile | null;
  lookups: TravelOrderCreationLookups;
  rows: readonly RequesterTravelOrderItem[];
  pagination?: TravelOrderPagination;
  currentFilter?: CurrentFilter;
  onUpdate: (formData: FormData) => Promise<void>;
  onCancel: (formData: FormData) => Promise<void>;
  feedback?: Readonly<{
    type: "success" | "error";
    text: string;
  }>;
}>;

export function RegularTravelOrdersView({
  profile,
  lookups,
  rows,
  pagination,
  currentFilter,
  onUpdate,
  onCancel,
  feedback,
}: RegularTravelOrdersViewProps) {
  return (
    <div className="space-y-4">
      {feedback ? (
        <section
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-[#ffcece] bg-[#fff3f3] text-[#a33a3a]"
              : "border-[#bde7c7] bg-[#f2fcf4] text-[#256f3a]"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.text}
        </section>
      ) : null}

      {!profile ? (
        <section className="rounded-lg border border-[#ffcece] bg-[#fff3f3] px-4 py-3 text-sm text-[#a33a3a]">
          Your requester profile is incomplete. Contact an administrator before
          creating a travel order.
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#dfe1ed] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#2f3339] sm:text-2xl">
              Travel Orders Table
            </h2>
            <p className="mt-1 text-xs text-[#7b8398]">
              Recent requests from your account. Open a row to track approvals,
              update pending details, or cancel pending requests.
            </p>
          </div>
          <Link
            href="/regular/travel-orders/create-travel-order"
            className="inline-flex items-center rounded-lg bg-[#3B9F41] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#359436]"
          >
            Create Travel Order
          </Link>
        </div>
        <div className="mt-4">
          <RegularTravelOrdersTable
            rows={rows}
            lookups={lookups}
            pagination={pagination}
            currentFilter={currentFilter}
            onUpdate={onUpdate}
            onCancel={onCancel}
          />
        </div>
      </section>
    </div>
  );
}

function FieldWrapper({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
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

function TextareaField({
  name,
  label,
  rows,
  required,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
}>) {
  return (
    <FieldWrapper label={label}>
      <textarea
        name={name}
        rows={rows}
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
  required,
  disabled,
  includeEmptyOption,
  emptyOptionLabel = "Select an option",
}: Readonly<{
  name: string;
  label: string;
  options: readonly { id: number; name: string }[];
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
        defaultValue={includeEmptyOption ? "" : options[0]?.id ?? ""}
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
