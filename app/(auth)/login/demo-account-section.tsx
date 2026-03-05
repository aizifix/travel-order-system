"use client";

import { HelpCircle } from "lucide-react";

export function DemoAccountSection() {
  return (
    <div className="relative z-40 mt-4 flex justify-end">
      <div className="group relative inline-flex">
        <button
          type="button"
          aria-haspopup="true"
          aria-label="Show demo account credentials"
          className="flex items-center gap-1.5 rounded-md border border-[#dfe1ed] bg-[#f8fafd] px-3 py-1.5 text-xs font-medium text-[#5d6780] transition-colors hover:bg-[#edf0f6] hover:text-[#2f3339]"
        >
          <HelpCircle className="h-4 w-4" />
          Demo Account
        </button>

        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-[70] w-[280px] translate-y-1 rounded-lg border border-[#dfe1ed] bg-white p-3 text-[11px] text-[#4a5266] opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          <p className="text-xs font-semibold text-[#2f3339]">Demo Accounts</p>
          <div className="mt-2 space-y-2">
            <div className="rounded bg-[#f8fafd] p-2">
              <p className="font-medium text-[#2f3339]">Admin</p>
              <p>admin@travelorder.gov.ph</p>
              <p className="text-[#7d8598]">pass: changeme</p>
            </div>
            <div className="rounded bg-[#f8fafd] p-2">
              <p className="font-medium text-[#2f3339]">Approver</p>
              <p>deliza.camaro@travelorder.gov.ph</p>
              <p className="text-[#7d8598]">pass: changeme</p>
            </div>
            <div className="rounded bg-[#f8fafd] p-2">
              <p className="font-medium text-[#2f3339]">Regular</p>
              <p>margo@gmail.com</p>
              <p className="text-[#7d8598]">pass: ZJ5))b#9xgc!vw</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
