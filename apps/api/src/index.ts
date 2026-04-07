import "dotenv/config";
import http from "node:http";
import cors from "cors";
import express from "express";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import { initSocket } from "./socket.js";

const app = express();
const server = http.createServer(app);

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/** Cardápio agrupado por categoria */
app.use("/products", productsRouter);

/** Pedidos: criar, consultar, painel, status, comanda */
app.use("/orders", ordersRouter);

initSocket(server);

const port = Number(process.env.PORT) || 4000;

server.listen(port, () => {
  console.log(`API + Socket.IO em http://localhost:${port}`);
});
