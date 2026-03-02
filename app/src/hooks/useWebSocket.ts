"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WsEvent } from "@/src/server/websocket/ws-events";

const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type UseWebSocketConnectionResult = Readonly<{
  lastEvent: WsEvent | null;
  isConnected: boolean;
  sendMessage: (message: unknown) => boolean;
}>;

function getWebSocketUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}

function isWsEvent(value: unknown): value is WsEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { type?: unknown; payload?: unknown; timestamp?: unknown };
  return (
    typeof candidate.type === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.payload === "object" &&
    candidate.payload !== null
  );
}

export function useWebSocketConnection(): UseWebSocketConnectionResult {
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const connect = () => {
      const url = getWebSocketUrl();
      if (!url) {
        return;
      }

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as unknown;
          if (!isWsEvent(parsed)) {
            return;
          }
          setLastEvent(parsed);
        } catch {
          // Ignore malformed events from non-app sources.
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;

        if (!shouldReconnectRef.current) {
          return;
        }

        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current += 1;

        const expDelay = Math.min(
          MAX_RECONNECT_DELAY_MS,
          BASE_RECONNECT_DELAY_MS * 2 ** Math.min(attempt, 5),
        );
        const jitter = Math.floor(Math.random() * 500);
        const nextDelay = Math.min(MAX_RECONNECT_DELAY_MS, expDelay + jitter);

        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          connectRef.current();
        }, nextDelay);
      };
    };

    connectRef.current = connect;
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [clearReconnectTimer]);

  const sendMessage = useCallback((message: unknown): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const payload =
        typeof message === "string" ? message : JSON.stringify(message);
      socket.send(payload);
      return true;
    } catch {
      return false;
    }
  }, []);

  return useMemo(
    () => ({
      lastEvent,
      isConnected,
      sendMessage,
    }),
    [isConnected, lastEvent, sendMessage],
  );
}
