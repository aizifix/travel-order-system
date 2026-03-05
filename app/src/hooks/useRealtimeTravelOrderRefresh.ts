"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/src/components/providers/WebSocketProvider";
import {
  WS_EVENT_TYPES,
  type WsEvent,
} from "@/src/server/websocket/ws-events";

const REFRESH_DEBOUNCE_MS = 250;

function isTravelOrderStatusChangedEvent(
  event: WsEvent,
): event is WsEvent<"travel-order:status-changed"> {
  return event.type === WS_EVENT_TYPES.TRAVEL_ORDER_STATUS_CHANGED;
}

export function useRealtimeTravelOrderRefresh(
  trackedOrderIds?: readonly number[],
): void {
  const { subscribe } = useWebSocket();
  const router = useRouter();
  const refreshTimerRef = useRef<number | null>(null);

  const trackedOrderIdSet = useMemo(() => {
    if (!trackedOrderIds || trackedOrderIds.length === 0) {
      return null;
    }

    const set = new Set<number>();
    for (const orderId of trackedOrderIds) {
      if (Number.isInteger(orderId) && orderId > 0) {
        set.add(orderId);
      }
    }
    return set.size > 0 ? set : null;
  }, [trackedOrderIds]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      console.log("[useRealtimeTravelOrderRefresh] Received event:", event.type, event.payload);

      if (!isTravelOrderStatusChangedEvent(event)) {
        console.log("[useRealtimeTravelOrderRefresh] Not a status changed event, ignoring");
        return;
      }

      if (
        trackedOrderIdSet &&
        !trackedOrderIdSet.has(event.payload.travelOrderId)
      ) {
        console.log("[useRealtimeTravelOrderRefresh] Travel order not in tracked set, ignoring");
        return;
      }

      console.log("[useRealtimeTravelOrderRefresh] Triggering router.refresh() for travelOrderId:", event.payload.travelOrderId);

      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        router.refresh();
        console.log("[useRealtimeTravelOrderRefresh] router.refresh() called");
      }, REFRESH_DEBOUNCE_MS);
    });
  }, [router, subscribe, trackedOrderIdSet]);
}
