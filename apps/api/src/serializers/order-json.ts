import type { Customer, Order, OrderItem, Payment } from "@prisma/client";

export type OrderJson = {
  id: string;
  customerId: string;
  deliveryType: string;
  address: string | null;
  notes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
  items: Array<{
    id: string;
    productId: string | null;
    productNameSnapshot: string;
    unitPrice: number;
    quantity: number;
    notes: string | null;
  }>;
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount: number;
    transactionId: string | null;
    createdAt: string;
  }>;
};

function num(d: { toString(): string }): number {
  return Number(d.toString());
}

export function toOrderJson(
  order: Order & {
    customer: Customer;
    items: OrderItem[];
    payments: Payment[];
  },
): OrderJson {
  return {
    id: order.id,
    customerId: order.customerId,
    deliveryType: order.deliveryType,
    address: order.address,
    notes: order.notes,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    subtotal: num(order.subtotal),
    deliveryFee: num(order.deliveryFee),
    total: num(order.total),
    createdAt: order.createdAt.toISOString(),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone,
    },
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productNameSnapshot: i.productNameSnapshot,
      unitPrice: num(i.unitPrice),
      quantity: i.quantity,
      notes: i.notes,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amount: num(p.amount),
      transactionId: p.transactionId,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
