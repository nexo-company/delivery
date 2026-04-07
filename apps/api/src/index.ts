import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import setupRouter from "./routes/setup.js";
import { initSocket } from "./socket.js";
import { corsOriginCallback } from "./cors-allow.js";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/setup", setupRouter);

/** Cardápio agrupado por categoria */
app.use("/products", productsRouter);

/** Pedidos: criar, consultar, painel, status, comanda */
app.use("/orders", ordersRouter);

initSocket(server);

const port = Number(process.env.PORT) || 4000;
const host = "0.0.0.0";

server.listen(port, host, () => {
  // "localhost" no log confunde em Docker: o processo escuta em todas as interfaces.
  console.log(`API + Socket.IO pronta na porta ${port} (bind ${host}, use a URL pública da Railway)`);
});
