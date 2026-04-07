"use client";

import { io, type Socket } from "socket.io-client";
import { apiBase } from "./api";
import type { PanelOrder } from "./api";

export type OrderSocket = Socket;

export function connectPanelSocket(handlers: {
  onNew: (o: PanelOrder) => void;
  onUpdated: (o: PanelOrder) => void;
}): OrderSocket {
  const socket = io(apiBase(), { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    socket.emit("panel:join");
  });
  socket.on("order:new", handlers.onNew);
  socket.on("order:updated", handlers.onUpdated);
  return socket;
}
