# WebSocket Realtime Architecture

> Last updated: 2026-03-02

## Overview

The Travel Order System now uses one websocket connection per authenticated session to deliver:

- realtime notifications
- realtime travel-order table updates
- realtime multi-step drawer timeline/status updates

No polling is required for the core travel-order status flow.

## Server Architecture

### Custom HTTP + WS Server (`server.ts`)

- Runs Next.js with a custom `http.Server`
- Handles websocket upgrade at `/ws`
- Verifies `to_session` cookie with `verifySessionToken`
- Registers connection with `WsManager.addClient(userId, ws)`

### WebSocket Manager (`app/src/server/websocket/ws-manager.ts`)

- Tracks active sockets by `userId`
- Supports multiple browser tabs per user
- Sends typed events to user-targeted socket groups
- Uses heartbeat ping/pong every 30s for stale cleanup

## Event Contract

### Event Types (`app/src/server/websocket/ws-events.ts`)

- `notification:new`
- `notification:count`
- `travel-order:status-changed`

Event envelope:

```ts
type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO-8601
};
```

`travel-order:status-changed` payload:

```ts
{
  travelOrderId: number;
  newStatus: string;
}
```

## Notification Layer

### Service (`app/src/server/notifications/service.ts`)

- `createAndPush()` inserts notification + pushes `notification:new` and `notification:count`
- `markRead()` / `markAllRead()` updates DB and pushes unread count
- `pushTravelOrderStatusChangedToUsers(userIds, payload)` fans one travel-order event out to all relevant users

## Travel Order Realtime Fanout

### Service (`app/src/server/travel-orders/service.ts`)

After each create/update/cancel/review mutation, the system pushes `travel-order:status-changed` to:

- requester
- assigned step-1 approver (when available)
- all active admin users

Notifications are still role-targeted, but table/drawer sync now reaches all affected reviewers.

## Client Hooks

### `useWebSocketConnection` (`app/src/hooks/useWebSocket.ts`)

- creates `/ws` connection
- reconnects with exponential backoff
- exposes `lastEvent` and `isConnected`

### `useNotifications` (`app/src/hooks/useNotifications.ts`)

- initializes notification snapshot from API
- applies incoming `notification:new` and `notification:count` events
- exposes mark-as-read actions

### `useRealtimeTravelOrderRefresh` (`app/src/hooks/useRealtimeTravelOrderRefresh.ts`)

- listens for `travel-order:status-changed`
- debounces `router.refresh()` to avoid refresh storms
- used by regular, approver, and admin travel-order tables

## UI Integration

### Websocket Provider

`app/(authenticated)/layout.tsx` wraps all authenticated pages with `WebSocketProvider`.

### Notification Bell

`LiveNotificationBell` consumes `useNotifications` for realtime badge and list updates.

### Travel-Order Tables + Drawer Slides

- regular table: `app/src/components/regular/travel-orders/regular-travel-orders-table.tsx`
- approver table: `app/src/components/approver/travel-orders/approver-travel-orders-table.tsx`
- admin table: `app/src/components/admin/travel-orders/admin-travel-orders-table.tsx`

Each table now:

- refreshes immediately when websocket travel-order events arrive
- keeps open drawer content synced from refreshed row data
- updates multi-step approval timeline/status cards live

## Extend Pattern

1. Add event type in `ws-events.ts`.
2. Push event from service after successful DB write.
3. Handle event in a focused client hook.
4. Keep UI state derived from refreshed server rows where possible.
