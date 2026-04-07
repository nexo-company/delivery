/** URL base da API (definir em .env.local para produção) */
export function apiBase(): string {
  const u = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return u.replace(/\/$/, "");
}

export type ApiProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  products: ApiProduct[];
};

export async function fetchMenu(): Promise<ApiCategory[]> {
  const r = await fetch(`${apiBase()}/products`, { cache: "no-store" });
  if (!r.ok) throw new Error("Falha ao carregar cardápio");
  return r.json() as Promise<ApiCategory[]>;
}

export type CreateOrderPayload = {
  customer: { name: string; phone: string };
  deliveryType: "retirada" | "entrega";
  address?: string | null;
  notes?: string | null;
  paymentMethod: "pix" | "cartao" | "dinheiro";
  items: Array<{ productId: string; quantity: number; notes?: string | null }>;
};

export async function createOrder(body: CreateOrderPayload) {
  const r = await fetch(`${apiBase()}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as { error?: unknown };
  if (!r.ok) {
    const err = data.error;
    let msg = "Erro ao criar pedido";
    if (typeof err === "string") msg = err;
    else if (err && typeof err === "object") {
      const o = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
      if (o.formErrors?.length) msg = o.formErrors.join("; ");
      else if (o.fieldErrors && Object.keys(o.fieldErrors).length) {
        msg = Object.entries(o.fieldErrors)
          .map(([k, v]) => `${k}: ${v?.join?.(", ") ?? ""}`)
          .join("; ");
      } else msg = "Dados inválidos";
    }
    throw new Error(msg);
  }
  return data;
}
