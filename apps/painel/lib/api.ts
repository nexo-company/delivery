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

export class PanelFetchError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "http" | "cors",
    readonly status?: number,
  ) {
    super(message);
    this.name = "PanelFetchError";
  }
}

export async function fetchPanelOrders(): Promise<PanelOrder[]> {
  const url = `${apiBase()}/orders/panel`;
  let r: Response;
  try {
    r = await fetch(url, { cache: "no-store" });
  } catch {
    throw new PanelFetchError("Falha de rede ao chamar a API.", "network");
  }
  if (!r.ok) {
    throw new PanelFetchError(`API respondeu ${r.status} em /orders/panel`, "http", r.status);
  }
  return r.json() as Promise<PanelOrder[]>;
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
