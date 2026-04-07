import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { OrderJson } from "./serializers/order-json.js";
import { socketCorsOriginCallback } from "./cors-allow.js";

/** Sala única do painel cozinha/caixa (evoluir para auth/tenant depois) */
export const PANEL_ROOM = "panel";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: socketCorsOriginCallback, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("panel:join", () => {
      void socket.join(PANEL_ROOM);
    });
  });

  return io;
}

export function emitNewOrder(order: OrderJson): void {
  io?.to(PANEL_ROOM).emit("order:new", order);
}

export function emitOrderUpdated(order: OrderJson): void {
  io?.to(PANEL_ROOM).emit("order:updated", order);
}
