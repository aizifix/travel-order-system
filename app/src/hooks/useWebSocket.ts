"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WsEvent } from "@/src/server/websocket/ws-events";

const BASE_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 5_000;

export type WsEventListener = (event: WsEvent) => void;

export type UseWebSocketConnectionResult = Readonly<{
  isConnected: boolean;
  sendMessage: (message: unknown) => boolean;
  subscribe: (listener: WsEventListener) => () => void;
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
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<WsEventListener>());
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
    const listeners = listenersRef.current;

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
        console.log("[useWebSocket] Connected to WebSocket server");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as unknown;
          console.log("[useWebSocket] Received message:", parsed);
          if (!isWsEvent(parsed)) {
            console.log("[useWebSocket] Invalid event format, ignoring");
            return;
          }
          for (const listener of listeners) {
            try {
              listener(parsed);
            } catch (error) {
              console.error("WebSocket event listener failed", error);
            }
          }
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
        const jitter = Math.floor(Math.random() * 250);
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
      listeners.clear();

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

  const subscribe = useCallback((listener: WsEventListener): (() => void) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return useMemo(
    () => ({
      isConnected,
      sendMessage,
      subscribe,
    }),
    [isConnected, sendMessage, subscribe],
  );
}
