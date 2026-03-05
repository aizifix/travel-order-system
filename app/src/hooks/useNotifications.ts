"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/src/components/providers/WebSocketProvider";
import type { NotificationItem } from "@/src/server/notifications/model";
import {
  WS_EVENT_TYPES,
  type WsEvent,
  type WsNotification,
} from "@/src/server/websocket/ws-events";

type NotificationsResponse = Readonly<{
  notifications: readonly NotificationItem[];
  unreadCount: number;
}>;

type NotificationPatchResponse = Readonly<{
  unreadCount: number;
}>;

const POLL_INTERVAL_CONNECTED_MS = 5_000;
const POLL_INTERVAL_DISCONNECTED_MS = 2_000;

async function loadNotifications(
  signal?: AbortSignal,
): Promise<NotificationsResponse> {
  const response = await fetch("/api/notifications?limit=20", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Notification fetch failed with status ${response.status}`);
  }

  return (await response.json()) as NotificationsResponse;
}

async function patchNotification(body: object): Promise<NotificationPatchResponse> {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Notification update failed with status ${response.status}`);
  }

  return (await response.json()) as NotificationPatchResponse;
}

function mapWsNotification(notification: WsNotification): NotificationItem {
  return {
    id: notification.id,
    userId: notification.userId,
    travelOrderId: notification.travelOrderId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

function upsertNotification(
  current: readonly NotificationItem[],
  nextItem: NotificationItem,
): readonly NotificationItem[] {
  const currentIndex = current.findIndex((item) => item.id === nextItem.id);
  if (currentIndex === -1) {
    return [nextItem, ...current].slice(0, 50);
  }

  const next = [...current];
  next[currentIndex] = nextItem;
  return next;
}

function isNotificationNewEvent(event: WsEvent): event is WsEvent<"notification:new"> {
  return event.type === WS_EVENT_TYPES.NOTIFICATION_NEW;
}

function isNotificationCountEvent(
  event: WsEvent,
): event is WsEvent<"notification:count"> {
  return event.type === WS_EVENT_TYPES.NOTIFICATION_COUNT;
}

function isNotificationMarkReadEvent(
  event: WsEvent,
): event is WsEvent<"notification:mark-read"> {
  return event.type === WS_EVENT_TYPES.NOTIFICATION_MARK_READ;
}

function isNotificationMarkAllReadEvent(
  event: WsEvent,
): event is WsEvent<"notification:mark-all-read"> {
  return event.type === WS_EVENT_TYPES.NOTIFICATION_MARK_ALL_READ;
}

export type UseNotificationsResult = Readonly<{
  notifications: readonly NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}>;

export function useNotifications(): UseNotificationsResult {
  const { isConnected, subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<readonly NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    const snapshot = await loadNotifications();
    setNotifications(snapshot.notifications);
    setUnreadCount(snapshot.unreadCount);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    void (async () => {
      setIsLoading(true);
      try {
        const snapshot = await loadNotifications(abortController.signal);
        setNotifications(snapshot.notifications);
        setUnreadCount(snapshot.unreadCount);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("useNotifications initial load failed", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      if (isNotificationNewEvent(event)) {
        const incoming = mapWsNotification(event.payload.notification);
        setNotifications((current) => upsertNotification(current, incoming));
        return;
      }

      if (isNotificationCountEvent(event)) {
        setUnreadCount(Math.max(0, event.payload.unreadCount));
        return;
      }

      if (isNotificationMarkReadEvent(event)) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === event.payload.notificationId ? { ...item, isRead: true } : item,
          ),
        );
        return;
      }

      if (isNotificationMarkAllReadEvent(event)) {
        setNotifications((current) =>
          current.map((item) => ({ ...item, isRead: true })),
        );
      }
    });
  }, [subscribe]);

  useEffect(() => {
    const intervalMs = isConnected
      ? POLL_INTERVAL_CONNECTED_MS
      : POLL_INTERVAL_DISCONNECTED_MS;

    const intervalId = window.setInterval(() => {
      void refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isConnected, refresh]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    void refresh();
  }, [isConnected, refresh]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (!Number.isInteger(notificationId) || notificationId < 1) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );

    try {
      const result = await patchNotification({ notificationId });
      setUnreadCount(Math.max(0, result.unreadCount));
    } catch (error) {
      console.error("markAsRead failed", error);
      void refresh();
    }
  }, [refresh]);

  const markAllReadAction = useCallback(async () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );

    try {
      const result = await patchNotification({ markAll: true });
      setUnreadCount(Math.max(0, result.unreadCount));
    } catch (error) {
      console.error("markAllRead failed", error);
      void refresh();
    }
  }, [refresh]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      refresh,
      markAsRead,
      markAllRead: markAllReadAction,
    }),
    [
      isConnected,
      isLoading,
      markAllReadAction,
      markAsRead,
      notifications,
      refresh,
      unreadCount,
    ],
  );
}
