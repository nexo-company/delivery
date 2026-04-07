import type { Decimal } from "@prisma/client/runtime/library";

type ReceiptOrder = {
  id: string;
  createdAt: Date;
  deliveryType: string;
  address: string | null;
  notes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: Decimal;
  deliveryFee: Decimal;
  total: Decimal;
  customer: { name: string; phone: string };
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    unitPrice: Decimal;
    notes: string | null;
  }>;
};

function money(n: Decimal | number): string {
  const v = typeof n === "number" ? n : Number(n);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function labelDeliveryType(t: string): string {
  if (t === "entrega") return "Entrega";
  if (t === "retirada") return "Retirada";
  return t;
}

function labelPayment(m: string): string {
  const map: Record<string, string> = {
    pix: "Pix",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
  };
  return map[m] ?? m;
}

function labelPaymentStatus(s: string): string {
  const map: Record<string, string> = {
    pendente: "Pendente",
    pago: "Pago",
    falhou: "Falhou",
  };
  return map[s] ?? s;
}

/**
 * Texto monoespaçado para impressora térmica / janela de impressão do navegador.
 * Largura típica ~48 colunas (80mm); linhas longas quebram visualmente no painel se necessário.
 */
export function buildThermalReceiptText(order: ReceiptOrder): string {
  const lines: string[] = [];
  const w = 42;
  const sep = "-".repeat(w);

  lines.push(sep);
  lines.push(`Pedido #${order.id.slice(-8).toUpperCase()}`);
  lines.push(`ID: ${order.id}`);
  lines.push(sep);
  lines.push(`Cliente: ${order.customer.name}`);
  lines.push(`Telefone: ${order.customer.phone}`);
  lines.push(`Tipo: ${labelDeliveryType(order.deliveryType)}`);
  if (order.deliveryType === "entrega" && order.address) {
    lines.push(`Endereço: ${order.address}`);
  }
  lines.push(`Pagamento: ${labelPayment(order.paymentMethod)}`);
  lines.push(`Status pag.: ${labelPaymentStatus(order.paymentStatus)}`);
  lines.push(`Status pedido: ${order.orderStatus}`);
  if (order.notes) lines.push(`Obs pedido: ${order.notes}`);
  lines.push(sep);
  lines.push("ITENS:");
  for (const it of order.items) {
    const sub = Number(it.unitPrice) * it.quantity;
    lines.push(`${it.quantity}x ${it.productNameSnapshot}`);
    lines.push(`    ${money(it.unitPrice)} un  =>  ${money(sub)}`);
    if (it.notes) lines.push(`    Obs: ${it.notes}`);
  }
  lines.push(sep);
  lines.push(`Subtotal: ${money(order.subtotal)}`);
  lines.push(`Taxa entrega: ${money(order.deliveryFee)}`);
  lines.push(`TOTAL: ${money(order.total)}`);
  lines.push(sep);
  lines.push(`Emitido: ${order.createdAt.toLocaleString("pt-BR")}`);
  lines.push("");
  return lines.join("\n");
}
