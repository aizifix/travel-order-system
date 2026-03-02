import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "@/src/server/db/mysql";

export type NotificationType =
  | "INFO"
  | "APPROVAL"
  | "REJECTION"
  | "RETURN"
  | "SYSTEM";

export type NotificationItem = Readonly<{
  id: number;
  userId: number;
  travelOrderId: number | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}>;

export type GetNotificationsOptions = Readonly<{
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}>;

export type CreateNotificationInput = Readonly<{
  userId: number;
  travelOrderId?: number | null;
  title: string;
  message: string;
  type: NotificationType;
}>;

type NotificationRow = RowDataPacket & {
  notification_id: number;
  user_id: number;
  travel_order_id: number | null;
  notification_title: string;
  notification_message: string;
  notification_type: NotificationType;
  is_read: 0 | 1;
  created_at: Date | string;
};

type CountRow = RowDataPacket & {
  unread_count: number;
};

function normalizeText(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, maxLength);
}

function toIsoTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

function mapNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.notification_id,
    userId: row.user_id,
    travelOrderId: row.travel_order_id,
    title: row.notification_title,
    message: row.notification_message,
    type: row.notification_type,
    isRead: row.is_read === 1,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export async function getByUserId(
  userId: number,
  options: GetNotificationsOptions = {},
): Promise<readonly NotificationItem[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(options.limit ?? 20)));
  const safeOffset = Math.max(0, Math.trunc(options.offset ?? 0));
  const unreadOnly = options.unreadOnly === true;

  const whereClauses = ["user_id = ?"];
  const params: Array<number> = [userId];

  if (unreadOnly) {
    whereClauses.push("is_read = 0");
  }

  const pool = getDbPool();
  const [rows] = await pool.execute<NotificationRow[]>(
    `
      SELECT
        notification_id,
        user_id,
        travel_order_id,
        notification_title,
        notification_message,
        notification_type,
        is_read,
        created_at
      FROM notifications
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY notification_id DESC
      LIMIT ?
      OFFSET ?
    `,
    [...params, safeLimit, safeOffset],
  );

  return rows.map(mapNotificationRow);
}

export async function getById(
  notificationId: number,
): Promise<NotificationItem | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<NotificationRow[]>(
    `
      SELECT
        notification_id,
        user_id,
        travel_order_id,
        notification_title,
        notification_message,
        notification_type,
        is_read,
        created_at
      FROM notifications
      WHERE notification_id = ?
      LIMIT 1
    `,
    [notificationId],
  );

  const row = rows[0];
  return row ? mapNotificationRow(row) : null;
}

export async function getUnreadCount(userId: number): Promise<number> {
  const pool = getDbPool();
  const [rows] = await pool.execute<CountRow[]>(
    `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = ?
        AND is_read = 0
    `,
    [userId],
  );

  return Number(rows[0]?.unread_count ?? 0);
}

export async function create(input: CreateNotificationInput): Promise<number> {
  const title = normalizeText(input.title, 255) || "Travel order update";
  const message = normalizeText(input.message, 20_000) || title;

  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO notifications (
        user_id,
        travel_order_id,
        notification_title,
        notification_message,
        notification_type
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [input.userId, input.travelOrderId ?? null, title, message, input.type],
  );

  return result.insertId;
}

export async function markAsRead(
  notificationId: number,
  userId: number,
): Promise<boolean> {
  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE notifications
      SET is_read = 1
      WHERE notification_id = ?
        AND user_id = ?
        AND is_read = 0
    `,
    [notificationId, userId],
  );

  return result.affectedRows > 0;
}

export async function markAllAsRead(userId: number): Promise<number> {
  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
        AND is_read = 0
    `,
    [userId],
  );

  return result.affectedRows;
}
