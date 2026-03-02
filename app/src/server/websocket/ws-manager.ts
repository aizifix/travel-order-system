import WebSocket from "ws";
import type { WsEvent } from "@/src/server/websocket/ws-events";

const HEARTBEAT_INTERVAL_MS = 30_000;

type TrackedWebSocket = WebSocket & {
  isAlive?: boolean;
  ownerUserId?: number;
};

function isSocketOpen(socket: WebSocket): boolean {
  return socket.readyState === WebSocket.OPEN;
}

export class WsManager {
  private static singleton: WsManager | null = null;

  private readonly clientsByUserId = new Map<number, Set<TrackedWebSocket>>();
  private readonly heartbeatTimer: NodeJS.Timeout;

  private constructor() {
    this.heartbeatTimer = setInterval(() => {
      this.runHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    if (typeof this.heartbeatTimer.unref === "function") {
      this.heartbeatTimer.unref();
    }
  }

  static getInstance(): WsManager {
    if (!WsManager.singleton) {
      WsManager.singleton = new WsManager();
    }
    return WsManager.singleton;
  }

  addClient(userId: number, socket: WebSocket): void {
    const trackedSocket = socket as TrackedWebSocket;
    trackedSocket.isAlive = true;
    trackedSocket.ownerUserId = userId;

    const sockets = this.clientsByUserId.get(userId) ?? new Set<TrackedWebSocket>();
    sockets.add(trackedSocket);
    this.clientsByUserId.set(userId, sockets);

    trackedSocket.on("pong", () => {
      trackedSocket.isAlive = true;
    });

    trackedSocket.on("close", () => {
      this.removeClient(userId, trackedSocket);
    });

    trackedSocket.on("error", () => {
      this.removeClient(userId, trackedSocket);
    });
  }

  sendToUser(userId: number, event: WsEvent): number {
    const sockets = this.clientsByUserId.get(userId);
    if (!sockets || sockets.size === 0) {
      return 0;
    }

    return this.sendToSockets(sockets, event);
  }

  broadcast(event: WsEvent): number {
    let delivered = 0;
    for (const sockets of this.clientsByUserId.values()) {
      delivered += this.sendToSockets(sockets, event);
    }
    return delivered;
  }

  getTotalConnectionCount(): number {
    let count = 0;
    for (const sockets of this.clientsByUserId.values()) {
      count += sockets.size;
    }
    return count;
  }

  getUserConnectionCount(userId: number): number {
    return this.clientsByUserId.get(userId)?.size ?? 0;
  }

  private sendToSockets(sockets: Set<TrackedWebSocket>, event: WsEvent): number {
    const message = JSON.stringify(event);
    let delivered = 0;

    for (const socket of sockets) {
      if (!isSocketOpen(socket)) {
        this.removeClient(socket.ownerUserId, socket);
        continue;
      }

      try {
        socket.send(message);
        delivered += 1;
      } catch {
        this.removeClient(socket.ownerUserId, socket);
      }
    }

    return delivered;
  }

  private runHeartbeat(): void {
    for (const [userId, sockets] of this.clientsByUserId.entries()) {
      for (const socket of sockets) {
        if (socket.isAlive === false) {
          socket.terminate();
          this.removeClient(userId, socket);
          continue;
        }

        socket.isAlive = false;
        try {
          socket.ping();
        } catch {
          socket.terminate();
          this.removeClient(userId, socket);
        }
      }
    }
  }

  private removeClient(userId: number | undefined, socket: TrackedWebSocket): void {
    if (typeof userId !== "number" || !Number.isInteger(userId)) {
      for (const [currentUserId, sockets] of this.clientsByUserId.entries()) {
        if (sockets.has(socket)) {
          sockets.delete(socket);
          if (sockets.size === 0) {
            this.clientsByUserId.delete(currentUserId);
          }
          return;
        }
      }
      return;
    }

    const sockets = this.clientsByUserId.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(socket);
    if (sockets.size === 0) {
      this.clientsByUserId.delete(userId);
    }
  }
}

export const wsManager = WsManager.getInstance();
