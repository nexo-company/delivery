import type { DeliveryType, OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { simulatePaymentProcessing } from "./payment.service.js";
import { toOrderJson, type OrderJson } from "../serializers/order-json.js";

export type CreateOrderInput = {
  customer: { name: string; phone: string };
  deliveryType: DeliveryType;
  address?: string | null;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  items: Array<{ productId: string; quantity: number; notes?: string | null }>;
};

const DELIVERY_FEE = 5; // MVP fixo; evoluir para tabela/região

function assertTransition(current: OrderStatus, next: OrderStatus): void {
  const flow: OrderStatus[] = [
    "pendente",
    "confirmado",
    "em_preparo",
    "pronto",
    "entregue",
  ];
  if (next === "cancelado") return;
  const ci = flow.indexOf(current);
  const ni = flow.indexOf(next);
  if (ci === -1 || ni === -1) {
    throw new Error("Transição de status inválida");
  }
  if (ni < ci) throw new Error("Não é permitido reverter status");
  if (ni > ci + 1) throw new Error("Avance um status por vez");
}

export async function createOrder(input: CreateOrderInput): Promise<OrderJson> {
  if (input.deliveryType === "entrega" && !input.address?.trim()) {
    throw new Error("Endereço obrigatório para entrega");
  }
  if (!input.items.length) throw new Error("Pedido sem itens");

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== productIds.length) {
    throw new Error("Produto inválido ou inativo");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;
  const lineInputs = input.items.map((line) => {
    const p = productMap.get(line.productId)!;
    const unit = Number(p.price);
    subtotal += unit * line.quantity;
    return {
      productId: p.id,
      productNameSnapshot: p.name,
      unitPrice: p.price,
      quantity: line.quantity,
      notes: line.notes ?? null,
    };
  });

  const deliveryFee = input.deliveryType === "entrega" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const decision = simulatePaymentProcessing(input.paymentMethod);

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { name: input.customer.name.trim(), phone: input.customer.phone.trim() },
    });

    const created = await tx.order.create({
      data: {
        customerId: customer.id,
        deliveryType: input.deliveryType,
        address: input.deliveryType === "entrega" ? input.address!.trim() : null,
        notes: input.notes?.trim() || null,
        paymentMethod: input.paymentMethod,
        paymentStatus: decision.paymentStatus,
        orderStatus: "pendente",
        subtotal,
        deliveryFee,
        total,
        items: { create: lineInputs },
      },
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        method: input.paymentMethod,
        status: decision.paymentStatus,
        amount: total,
        transactionId: decision.transactionId,
      },
    });

    return tx.order.findUniqueOrThrow({
      where: { id: created.id },
      include: { customer: true, items: true, payments: true },
    });
  });

  return toOrderJson(order);
}

export async function getOrderById(id: string): Promise<OrderJson | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: true, payments: true },
  });
  return order ? toOrderJson(order) : null;
}

export async function listOrdersForPanel(): Promise<OrderJson[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true, payments: true },
    take: 50,
  });
  return orders.map(toOrderJson);
}

export async function updateOrderStatus(orderId: string, next: OrderStatus): Promise<OrderJson | null> {
  const current = await prisma.order.findUnique({ where: { id: orderId } });
  if (!current) return null;
  assertTransition(current.orderStatus, next);
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: next },
    include: { customer: true, items: true, payments: true },
  });
  return toOrderJson(order);
}
