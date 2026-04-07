export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
}

export type PanelOrder = {
  id: string;
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
  customer: { name: string; phone: string };
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    notes: string | null;
  }>;
};

export async function fetchPanelOrders(): Promise<PanelOrder[]> {
  const r = await fetch(`${apiBase()}/orders/panel`, { cache: "no-store" });
  if (!r.ok) throw new Error("Falha ao carregar pedidos");
  return r.json();
}

export async function patchOrderStatus(id: string, orderStatus: PanelOrder["orderStatus"]) {
  const r = await fetch(`${apiBase()}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderStatus }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error ?? "Erro ao atualizar");
  return data as PanelOrder;
}

export async function fetchReceiptText(id: string): Promise<string> {
  const r = await fetch(`${apiBase()}/orders/${id}/receipt`);
  const data = await r.json();
  if (!r.ok) throw new Error((data as { error?: string }).error ?? "Erro na comanda");
  return (data as { text: string }).text;
}
