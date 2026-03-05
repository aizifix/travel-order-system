"use client";

import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded-md ${className ?? ""}`}
      style={style}
    />
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 7 }: { rows?: number; columns?: number }) {
  const widthPattern = [62, 74, 58, 81, 67, 72, 64, 77];

  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-[#f3f5fa]">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-4">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#dfe1ed] last:border-b-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <Skeleton
                    className="h-4"
                    style={{
                      width: `${widthPattern[(rowIndex + colIndex) % widthPattern.length]}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-8 w-16" />
        </div>
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
    </div>
  );
}

// Metric Cards Skeleton
export function MetricCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Form Section Skeleton
export function FormSectionSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-[#dfe1ed] bg-[#fafbfe] p-4 space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Filter Bar Skeleton
export function FilterBarSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

// Welcome Banner Skeleton
export function WelcomeBannerSkeleton() {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-[#3B9F41]/20 to-[#F0F0F0] p-6 sm:p-7">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
    </section>
  );
}

// Modal Skeleton
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

// List Items Skeleton
export function ListItemsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-[#dfe1ed] bg-white">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
