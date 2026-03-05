"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type MonthlyPoint = Readonly<{
  label: string;
  value: number;
}>;

type TravelOrdersOverviewCardProps = Readonly<{
  monthlySeries: readonly MonthlyPoint[];
  totalOrders: number;
  year: number;
}>;

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function TravelOrdersOverviewCard({
  monthlySeries,
  totalOrders,
  year,
}: TravelOrdersOverviewCardProps) {
  const initialIndex = Math.max(monthlySeries.length - 1, 0);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const maxMonthlyValue = useMemo(
    () => Math.max(1, ...monthlySeries.map((point) => point.value)),
    [monthlySeries],
  );
  const hasData = useMemo(
    () => monthlySeries.some((point) => point.value > 0),
    [monthlySeries],
  );
  const yAxisTicks = useMemo(
    () => [1, 0.75, 0.5, 0.25].map((ratio) => Math.round(maxMonthlyValue * ratio)),
    [maxMonthlyValue],
  );

  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(monthlySeries.length - 1, 0));
  const activePoint = monthlySeries[safeActiveIndex] ?? { label: "-", value: 0 };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#dfe1ed] bg-white p-4 xl:col-span-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight text-[#2f3339]">
            Travel Orders Overview
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-[#26AF5D]">+{totalOrders} this year</p>
          <p className="mt-1 text-xs text-[#5d6780]">
            {activePoint.label}: <span className="font-semibold">{NUMBER_FORMATTER.format(activePoint.value)}</span>{" "}
            order{activePoint.value === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex cursor-default items-center gap-1 rounded-lg border border-[#dfe1ed] bg-[#f9fafc] px-3 py-1.5 text-xs font-semibold text-[#5d6780]"
          aria-label={`Year ${year}`}
        >
          {year}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="mt-4 flex-1 overflow-x-auto"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
          }

          event.preventDefault();
          if (event.key === "ArrowLeft") {
            setActiveIndex((previous) => Math.max(previous - 1, 0));
            return;
          }

          setActiveIndex((previous) =>
            Math.min(previous + 1, Math.max(monthlySeries.length - 1, 0)),
          );
        }}
      >
        <div className="relative flex h-[340px] min-w-[520px] items-end gap-3 pb-2 pl-8 pr-1">
          {!hasData ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <p className="rounded-lg border border-[#dfe1ed] bg-white/95 px-3 py-2 text-xs font-medium text-[#7d8598] shadow-sm">
                No monthly order data yet.
              </p>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-y-2 left-0 flex w-8 flex-col justify-between text-[10px] font-medium text-[#8d95aa]">
            {yAxisTicks.map((tickValue) => (
              <span key={`tick-${tickValue}`} className="leading-none">
                {tickValue}
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-8 inset-y-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`grid-${index}`}
                className="absolute left-0 right-0 border-t border-dashed border-[#e7eaf2]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
          </div>

          {monthlySeries.map((point, index) => {
            const height = Math.max(8, Math.round((point.value / maxMonthlyValue) * 100));
            const isActive = index === safeActiveIndex;

            return (
              <button
                key={point.label}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className="group relative z-20 flex flex-1 cursor-pointer flex-col items-center gap-2 focus:outline-none"
                aria-label={`${point.label}: ${point.value} orders`}
              >
                <div
                  className={`flex h-full w-full max-w-10 items-end rounded-md border p-1 transition ${
                    isActive
                      ? "border-[#74c497] bg-[#eef8f1] shadow-[0_10px_20px_rgba(59,159,65,0.15)]"
                      : "border-[#e6e9f2] bg-[#f2f4f9]"
                  }`}
                >
                  <div
                    className={`w-full rounded transition ${isActive ? "bg-[#5fb98a]" : "bg-[#87d9aa]"}`}
                    style={{ height: `${height}%` }}
                    title={`${point.label}: ${point.value}`}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium transition ${
                    isActive ? "text-[#2f3339]" : "text-[#6d768b] group-hover:text-[#4a5266]"
                  }`}
                >
                  {point.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
