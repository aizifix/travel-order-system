import {
  create as createNotification,
  getById,
  getByUserId,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  type CreateNotificationInput,
  type GetNotificationsOptions,
  type NotificationItem,
} from "@/src/server/notifications/model";
import { wsManager } from "@/src/server/websocket/ws-manager";
import {
  WS_EVENT_TYPES,
  createWsEvent,
  type WsNotification,
} from "@/src/server/websocket/ws-events";

export type NotificationListResult = Readonly<{
  notifications: readonly NotificationItem[];
  unreadCount: number;
}>;

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_NO_SUCH_TABLE";
}

function mapToWsNotification(notification: NotificationItem): WsNotification {
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

async function pushUnreadCount(userId: number): Promise<number> {
  const unreadCount = await getUnreadCount(userId);
  wsManager.sendToUser(
    userId,
    createWsEvent(WS_EVENT_TYPES.NOTIFICATION_COUNT, { unreadCount }),
  );
  return unreadCount;
}

export async function getNotifications(
  userId: number,
  options: GetNotificationsOptions = {},
): Promise<NotificationListResult> {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getByUserId(userId, options),
      getUnreadCount(userId),
    ]);

    return {
      notifications,
      unreadCount,
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
    throw error;
  }
}

export async function createAndPush(
  input: CreateNotificationInput,
): Promise<NotificationItem | null> {
  try {
    const notificationId = await createNotification(input);
    const [notification, unreadCount] = await Promise.all([
      getById(notificationId),
      getUnreadCount(input.userId),
    ]);

    if (notification) {
      wsManager.sendToUser(
        input.userId,
        createWsEvent(WS_EVENT_TYPES.NOTIFICATION_NEW, {
          notification: mapToWsNotification(notification),
        }),
      );
    }

    wsManager.sendToUser(
      input.userId,
      createWsEvent(WS_EVENT_TYPES.NOTIFICATION_COUNT, { unreadCount }),
    );

    return notification;
  } catch (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function markRead(
  notificationId: number,
  userId: number,
): Promise<Readonly<{ changed: boolean; unreadCount: number }>> {
  try {
    const changed = await markAsRead(notificationId, userId);
    const unreadCount = await pushUnreadCount(userId);
    return { changed, unreadCount };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { changed: false, unreadCount: 0 };
    }
    throw error;
  }
}

export async function markAllRead(
  userId: number,
): Promise<Readonly<{ changedCount: number; unreadCount: number }>> {
  try {
    const changedCount = await markAllAsRead(userId);
    const unreadCount = await pushUnreadCount(userId);
    return { changedCount, unreadCount };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { changedCount: 0, unreadCount: 0 };
    }
    throw error;
  }
}

export function pushTravelOrderStatusChanged(
  userId: number,
  payload: Readonly<{
    travelOrderId: number;
    newStatus: string;
  }>,
): void {
  wsManager.sendToUser(
    userId,
    createWsEvent(WS_EVENT_TYPES.TRAVEL_ORDER_STATUS_CHANGED, payload),
  );
}
