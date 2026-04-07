import { Router } from "express";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { assertPaymentMethod } from "../services/payment.service.js";
import {
  createOrder,
  getOrderById,
  listOrdersForPanel,
  updateOrderStatus,
} from "../services/order.service.js";
import { getReceiptPayload } from "../services/print.service.js";
import { emitNewOrder, emitOrderUpdated } from "../socket.js";

const router = Router();

const createBody = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(5),
  }),
  deliveryType: z.enum(["retirada", "entrega"]),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        notes: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const body = parsed.data;
    if (!assertPaymentMethod(body.paymentMethod)) {
      res.status(400).json({ error: "Forma de pagamento inválida" });
      return;
    }
    const order = await createOrder({
      customer: body.customer,
      deliveryType: body.deliveryType,
      address: body.address,
      notes: body.notes,
      paymentMethod: body.paymentMethod,
      items: body.items,
    });
    emitNewOrder(order);
    res.status(201).json(order);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    if (msg.includes("obrigatório") || msg.includes("inválido") || msg.includes("sem itens")) {
      res.status(400).json({ error: msg });
      return;
    }
    next(e);
  }
});

router.get("/panel", async (_req, res, next) => {
  try {
    const orders = await listOrdersForPanel();
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    res.json(order);
  } catch (e) {
    next(e);
  }
});

const statusBody = z.object({
  orderStatus: z.enum([
    "pendente",
    "confirmado",
    "em_preparo",
    "pronto",
    "entregue",
    "cancelado",
  ]),
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const parsed = statusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const nextStatus = parsed.data.orderStatus as OrderStatus;
    const order = await updateOrderStatus(req.params.id, nextStatus);
    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    emitOrderUpdated(order);
    res.json(order);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    if (msg.includes("inválida") || msg.includes("reverter") || msg.includes("Avance")) {
      res.status(400).json({ error: msg });
      return;
    }
    next(e);
  }
});

router.get("/:id/receipt", async (req, res, next) => {
  try {
    const payload = await getReceiptPayload(req.params.id);
    if (!payload) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

export default router;
