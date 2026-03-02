import { createServer, type IncomingMessage } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import {
  AUTH_SESSION_COOKIE,
  verifySessionToken,
} from "./app/src/server/auth/session";
import { wsManager } from "./app/src/server/websocket/ws-manager";

type NextAppWithUpgradeHandler = ReturnType<typeof next> & {
  getUpgradeHandler?: () => (
    req: IncomingMessage,
    socket: import("node:net").Socket,
    head: Buffer,
  ) => void;
};

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const cookiePairs = cookieHeader.split(";");
  for (const pair of cookiePairs) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) {
      continue;
    }

    const separatorIndex = trimmedPair.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmedPair.slice(0, separatorIndex).trim();
    if (key !== name) {
      continue;
    }

    return decodeURIComponent(trimmedPair.slice(separatorIndex + 1).trim());
  }

  return undefined;
}

async function bootstrap() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = process.env.HOST ?? "localhost";
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);

  const app = next({ dev, hostname, port });
  const appWithUpgradeHandler = app as NextAppWithUpgradeHandler;

  const wsServer = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });

  await app.prepare();
  const requestHandler = app.getRequestHandler();
  const upgradeHandler = appWithUpgradeHandler.getUpgradeHandler?.();

  const server = createServer((request, response) => {
    void requestHandler(request, response);
  });

  server.on("upgrade", (request, socket, head) => {
    const host = request.headers.host ?? "localhost";
    const requestPath = request.url ?? "";
    const parsedUrl = new URL(requestPath, `http://${host}`);

    if (parsedUrl.pathname !== "/ws") {
      if (upgradeHandler) {
        upgradeHandler(request, socket, head);
        return;
      }

      socket.destroy();
      return;
    }

    const cookieHeader = request.headers.cookie ?? "";
    const sessionToken = getCookieValue(cookieHeader, AUTH_SESSION_COOKIE);
    const session = verifySessionToken(sessionToken);

    if (!session) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsManager.addClient(session.userId, ws);
    });
  });

  server.listen(port, hostname, () => {
    console.log(
      `> Travel Order server ready on http://${hostname}:${port} (ws endpoint: /ws)`,
    );
  });
}

bootstrap().catch((error) => {
  console.error("Unable to start server", error);
  process.exit(1);
});
