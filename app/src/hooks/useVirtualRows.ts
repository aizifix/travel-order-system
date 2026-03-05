"use client";

import type { RefObject, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseVirtualRowsOptions = Readonly<{
  rowCount: number;
  estimateRowHeight: number;
  enabled: boolean;
  overscan?: number;
}>;

type UseVirtualRowsResult = Readonly<{
  containerRef: RefObject<HTMLDivElement | null>;
  handleScroll: (event: UIEvent<HTMLDivElement>) => void;
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
}>;

const DEFAULT_OVERSCAN = 6;

export function useVirtualRows({
  rowCount,
  estimateRowHeight,
  enabled,
  overscan = DEFAULT_OVERSCAN,
}: UseVirtualRowsOptions): UseVirtualRowsResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      setScrollTop(event.currentTarget.scrollTop);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateViewport = () => {
      setViewportHeight(container.clientHeight);
    };

    const frameId = requestAnimationFrame(updateViewport);

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new ResizeObserver(updateViewport);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [enabled, rowCount]);

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!enabled || rowCount <= 0) {
      return {
        startIndex: 0,
        endIndex: rowCount,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const visibleCount = Math.max(1, Math.ceil(viewportHeight / estimateRowHeight));
    const start = Math.max(0, Math.floor(scrollTop / estimateRowHeight) - overscan);
    const end = Math.min(rowCount, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: start * estimateRowHeight,
      bottomSpacerHeight: Math.max(0, (rowCount - end) * estimateRowHeight),
    };
  }, [enabled, estimateRowHeight, overscan, rowCount, scrollTop, viewportHeight]);

  return {
    containerRef,
    handleScroll,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
  };
}
