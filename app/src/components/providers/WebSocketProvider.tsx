"use client";

import { createContext, useContext } from "react";
import {
  useWebSocketConnection,
  type UseWebSocketConnectionResult,
} from "@/src/hooks/useWebSocket";

const WebSocketContext = createContext<UseWebSocketConnectionResult | null>(null);

export function WebSocketProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const connection = useWebSocketConnection();

  return (
    <WebSocketContext.Provider value={connection}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): UseWebSocketConnectionResult {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
