"use client";

import { useCallback, useMemo } from "react";
import {
  NotificationBellButton,
  type NotificationBellItem,
} from "@/src/components/admin/notification-bell-button";
import { useNotifications } from "@/src/hooks/useNotifications";

export type NotificationViewerRole = "admin" | "approver" | "regular";

type LiveNotificationBellProps = Readonly<{
  role: NotificationViewerRole;
}>;

function formatTimestampLabel(isoDate: string): string | undefined {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationHref(
  role: NotificationViewerRole,
  travelOrderId: number | null,
): string | undefined {
  if (typeof travelOrderId !== "number" || !Number.isInteger(travelOrderId) || travelOrderId < 1) {
    return undefined;
  }

  switch (role) {
    case "approver":
      return `/approver/travel-orders?travelOrderId=${travelOrderId}`;
    case "admin":
      return `/admin/travel-orders?travelOrderId=${travelOrderId}`;
    case "regular":
      return "/regular/travel-orders";
    default:
      return undefined;
  }
}

export function LiveNotificationBell({ role }: LiveNotificationBellProps) {
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();

  const items = useMemo<readonly NotificationBellItem[]>(
    () =>
      notifications.map((notification) => ({
        id: String(notification.id),
        title: notification.title,
        description: notification.message,
        href: getNotificationHref(role, notification.travelOrderId),
        timestampLabel: formatTimestampLabel(notification.createdAt),
        isNew: !notification.isRead,
      })),
    [notifications, role],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && unreadCount > 0) {
        void markAllRead();
      }
    },
    [markAllRead, unreadCount],
  );

  const handleItemClick = useCallback(
    (itemId: string) => {
      const parsedId = Number.parseInt(itemId, 10);
      if (!Number.isInteger(parsedId) || parsedId < 1) {
        return;
      }
      void markAsRead(parsedId);
    },
    [markAsRead],
  );

  return (
    <NotificationBellButton
      count={unreadCount}
      items={items}
      onOpenChange={handleOpenChange}
      onItemClick={handleItemClick}
      emptyMessage="No notifications yet."
    />
  );
}
