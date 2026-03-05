export const WS_EVENT_TYPES = {
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_COUNT: "notification:count",
  NOTIFICATION_MARK_READ: "notification:mark-read",
  NOTIFICATION_MARK_ALL_READ: "notification:mark-all-read",
  TRAVEL_ORDER_STATUS_CHANGED: "travel-order:status-changed",
} as const;

export type WsNotificationType =
  | "INFO"
  | "APPROVAL"
  | "REJECTION"
  | "RETURN"
  | "SYSTEM";

export type WsNotification = Readonly<{
  id: number;
  userId: number;
  travelOrderId: number | null;
  title: string;
  message: string;
  type: WsNotificationType;
  isRead: boolean;
  createdAt: string;
}>;

export type WsEventPayloadMap = Readonly<{
  [WS_EVENT_TYPES.NOTIFICATION_NEW]: Readonly<{
    notification: WsNotification;
  }>;
  [WS_EVENT_TYPES.NOTIFICATION_COUNT]: Readonly<{
    unreadCount: number;
  }>;
  [WS_EVENT_TYPES.NOTIFICATION_MARK_READ]: Readonly<{
    notificationId: number;
  }>;
  [WS_EVENT_TYPES.NOTIFICATION_MARK_ALL_READ]: Readonly<Record<never, never>>;
  [WS_EVENT_TYPES.TRAVEL_ORDER_STATUS_CHANGED]: Readonly<{
    travelOrderId: number;
    newStatus: string;
  }>;
}>;

export type WsEventType = keyof WsEventPayloadMap;

export type WsEvent<T extends WsEventType = WsEventType> = Readonly<{
  type: T;
  payload: WsEventPayloadMap[T];
  timestamp: string;
}>;

export function createWsEvent<T extends WsEventType>(
  type: T,
  payload: WsEventPayloadMap[T],
): WsEvent<T> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}
