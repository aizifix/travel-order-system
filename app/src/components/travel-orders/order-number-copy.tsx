"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

type OrderNumberCopyProps = Readonly<{
  orderNo: string;
  className?: string;
}>;

const RESET_DELAY_MS = 1500;

export function OrderNumberCopy({ orderNo, className }: OrderNumberCopyProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopyState("idle");
      resetTimerRef.current = null;
    }, RESET_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderNo);
      } else {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = orderNo;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) {
          setCopyState("error");
          scheduleReset();
          return;
        }
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    scheduleReset();
  }, [orderNo, scheduleReset]);

  return (
    <div
      className={`mt-0.5 flex items-center gap-2 text-xs text-[#7b8398] ${className ?? ""}`}
    >
      <span className="font-medium text-[#5d6780]">#{orderNo}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#dfe1ed] text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
        aria-label={`Copy travel order number ${orderNo}`}
        title="Copy travel order number"
      >
        {copyState === "copied" ? (
          <Check className="h-3.5 w-3.5 text-[#2f8f44]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <span aria-live="polite" className="text-[11px] text-[#7b8398]">
        {copyState === "copied"
          ? "Copied"
          : copyState === "error"
            ? "Copy failed"
            : ""}
      </span>
    </div>
  );
}
