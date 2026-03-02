# WebSocket Real-Time Notifications

> **Last updated:** 2026-03-02

---

## Overview

A WebSocket layer on top of the existing Travel Order System that delivers **instant, in-app notifications** when travel orders are created, approved, rejected, or returned — without polling.

---

## Architecture

```
Browser (React)                          Server (Node.js)
─────────────────                        ────────────────
useWebSocket hook  ◄──── ws(s)://host ───►  custom server.ts
        │                                       │
        ▼                                       ▼
useNotifications   ◄── JSON events ──►   WsManager singleton
        │                                       │
        ▼                                       ▼
NotificationBell                         Notification Service
                                                │
                                                ▼
                                         MySQL (notifications table)
```

### Custom HTTP Server (`server.ts`)

Next.js does not natively support persistent WebSocket connections from API routes. A lightweight **custom `server.ts`** wraps Next.js's request handler and adds a `ws` upgrade listener on the same port.

- Creates `http.Server`, passes HTTP requests to `next().getRequestHandler()`
- On the `upgrade` event, parses the `to_session` cookie, verifies with `verifySessionToken`
- Delegates accepted sockets to `WsManager.addClient(userId, ws)`

### WebSocket Manager (`src/server/websocket/ws-manager.ts`)

Singleton class managing all active connections:

- `Map<number, Set<WebSocket>>` — maps user ID → connections (supports multiple tabs)
- `addClient(userId, ws)` — registers socket, sets up `close`/`error` cleanup
- `sendToUser(userId, event)` — serialises a typed event and sends to all sockets for that user
- `broadcast(event)` — sends to every connected client
- Heartbeat (`ping`/`pong`) every 30 s to detect stale connections

---

## WebSocket Events (`src/server/websocket/ws-events.ts`)

| Event                          | Direction     | Payload                                      |
|--------------------------------|---------------|----------------------------------------------|
| `notification:new`             | Server → Client | `{ notification }` — full notification object |
| `notification:count`           | Server → Client | `{ unreadCount: number }`                    |
| `travel-order:status-changed`  | Server → Client | `{ travelOrderId, newStatus }`               |

All events follow the shape:

```ts
type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO 8601
};
```

---

## Notification Server Layer

### Model (`app/src/server/notifications/model.ts`)

SQL queries against the existing `notifications` table:

- `getByUserId(userId, { limit, offset, unreadOnly })` → rows
- `getUnreadCount(userId)` → number
- `create(data)` → insert, return `notification_id`
- `markAsRead(notificationId, userId)` → update `is_read = 1`
- `markAllAsRead(userId)` → update all

### Service (`app/src/server/notifications/service.ts`)

- `createAndPush(data)` — inserts DB record **and** pushes via WsManager
- `getNotifications(userId, filters)` — thin wrapper over model
- `markRead(notificationId, userId)` / `markAllRead(userId)` — updates + pushes count

### API Routes (`app/api/notifications/route.ts`)

| Method  | Endpoint              | Description                                  |
|---------|-----------------------|----------------------------------------------|
| `GET`   | `/api/notifications`  | List notifications for the current user      |
| `PATCH` | `/api/notifications`  | Mark read (`{ notificationId }`) or mark all |

---

## Travel Order Integration

In `app/src/server/travel-orders/service.ts`, after each status change:

| Action         | Notified User(s)     | Notification Type |
|----------------|----------------------|-------------------|
| TO **created** | Assigned approver(s) | `APPROVAL`        |
| TO **approved**| TO creator           | `INFO`            |
| TO **rejected**| TO creator           | `REJECTION`       |
| TO **returned**| TO creator           | `RETURN`          |

Each call creates a DB record *and* pushes a real-time event in one step.

---

## Client-Side Hooks

### `useWebSocket` (`app/src/hooks/useWebSocket.ts`)

- Opens `ws(s)://host/ws` on mount
- Auto-reconnects with exponential back-off (1 s → 2 s → 4 s … max 30 s)
- Exposes `lastEvent`, `isConnected`, `sendMessage`
- Cleans up on unmount

### `useNotifications` (`app/src/hooks/useNotifications.ts`)

- Fetches initial notifications from `GET /api/notifications`
- Listens for `notification:new` / `notification:count` events via `useWebSocket`
- Exposes `notifications`, `unreadCount`, `markAsRead`, `markAllAsRead`

### `WebSocketProvider` (`app/src/components/providers/WebSocketProvider.tsx`)

- Wraps the authenticated layout — single socket per session
- Provides context consumed by `useWebSocket`

---

## UI Integration

### Notification Bell

The existing `NotificationBellButton` component is wired to live data via `useNotifications`:

- Real-time unread badge count
- Live notification items in the dropdown
- Mark-as-read support

### Authenticated Layout

`app/(authenticated)/layout.tsx` wraps children with `<WebSocketProvider>` so all authenticated pages share a single WebSocket connection.

---

## Package Changes

| Dependency   | Type | Purpose                       |
|--------------|------|-------------------------------|
| `ws`         | prod | WebSocket server              |
| `@types/ws`  | dev  | TypeScript types for `ws`     |
| `tsx`        | dev  | Run `server.ts` in dev mode   |

### Script Changes

```json
{
  "dev": "tsx watch server.ts",
  "start": "node server.js",
  "build:server": "tsc --project tsconfig.server.json"
}
```

---

## Extending with New Events

1. Add the new event type to `ws-events.ts`
2. In the relevant service, call `WsManager.sendToUser()` or `WsManager.broadcast()`
3. On the client, handle the event in the appropriate hook

---

## File Map

```
project-root/
├─ server.ts                                  # Custom HTTP + WS server
├─ src/server/websocket/
│  ├─ ws-manager.ts                           # Connection manager singleton
│  └─ ws-events.ts                            # Event type definitions
├─ app/src/server/notifications/
│  ├─ model.ts                                # DB queries
│  └─ service.ts                              # Business logic + WS push
├─ app/api/notifications/
│  └─ route.ts                                # REST endpoints
├─ app/src/hooks/
│  ├─ useWebSocket.ts                         # WS connection hook
│  └─ useNotifications.ts                     # Notification state hook
└─ app/src/components/providers/
   └─ WebSocketProvider.tsx                   # React context provider
```
