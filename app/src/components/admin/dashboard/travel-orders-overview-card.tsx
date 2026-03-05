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

      <div className="mt-4 flex-1 overflow-x-auto">
        <div className="flex h-[280px] min-w-[430px] items-end gap-2 pb-1">
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
                className="group flex flex-1 cursor-pointer flex-col items-center gap-2"
                aria-label={`${point.label}: ${point.value} orders`}
              >
                <div
                  className={`flex h-full w-full max-w-8 items-end rounded-md border p-1 transition ${
                    isActive
                      ? "border-[#74c497] bg-[#eef8f1]"
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
