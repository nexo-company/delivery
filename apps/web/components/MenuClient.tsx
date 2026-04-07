"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiBase,
  createOrder,
  fetchMenu,
  type ApiCategory,
  type ApiProduct,
  type CreateOrderPayload,
} from "@/lib/api";

type CartLine = {
  product: ApiProduct;
  quantity: number;
  notes: string;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MenuClient() {
  const [detail, setDetail] = useState<ApiProduct | null>(null);
  const [menu, setMenu] = useState<ApiCategory[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState<"retirada" | "entrega">("retirada");
  const [paymentMethod, setPaymentMethod] = useState<CreateOrderPayload["paymentMethod"]>("pix");

  useEffect(() => {
    fetchMenu()
      .then(setMenu)
      .catch(() => setLoadErr("Não foi possível carregar o cardápio. A API está rodando?"));
  }, []);

  const addProduct = useCallback((p: ApiProduct) => {
    setCart((c) => {
      const cur = c[p.id];
      return {
        ...c,
        [p.id]: cur
          ? { ...cur, quantity: cur.quantity + 1 }
          : { product: p, quantity: 1, notes: "" },
      };
    });
  }, []);

  const setQty = useCallback((id: string, q: number) => {
    setCart((c) => {
      if (q <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      const line = c[id];
      if (!line) return c;
      return { ...c, [id]: { ...line, quantity: q } };
    });
  }, []);

  const totals = useMemo(() => {
    let sub = 0;
    for (const l of Object.values(cart)) {
      sub += l.product.price * l.quantity;
    }
    const fee = deliveryType === "entrega" ? 5 : 0;
    return { sub, fee, total: sub + fee };
  }, [cart, deliveryType]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((a, l) => a + l.quantity, 0),
    [cart],
  );

  async function onSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    if (deliveryType === "entrega" && !address.trim()) return;
    const items = Object.values(cart).map((l) => ({
      productId: l.product.id,
      quantity: l.quantity,
      notes: l.notes.trim() || null,
    }));
    const payload: CreateOrderPayload = {
      customer: { name: name.trim(), phone: phone.trim() },
      deliveryType,
      address: deliveryType === "entrega" ? address.trim() : null,
      notes: notes.trim() || null,
      paymentMethod,
      items,
    };
    setSubmitting(true);
    try {
      const order = (await createOrder(payload)) as { id: string };
      setDoneId(order.id);
      setCart({});
      setDrawer(false);
      setCheckout(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadErr) {
    return (
      <div className="container">
        <p style={{ color: "#f87171" }}>{loadErr}</p>
        <p className="sub">Verifique se a API está em {apiBase()}</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="container">
        <p className="sub">Carregando cardápio…</p>
      </div>
    );
  }

  if (doneId) {
    return (
      <div className="container success">
        <h2>Pedido recebido!</h2>
        <p>Seu pedido foi enviado para a cozinha.</p>
        <p className="sub" style={{ wordBreak: "break-all" }}>
          Nº {doneId}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setDoneId(null)}>
          Novo pedido
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <h1>Cardápio</h1>
        <p className="sub">Monte seu pedido e finalize no carrinho.</p>

        {menu.map((cat) => (
          <section key={cat.id}>
            <h2 className="cat-title">{cat.name}</h2>
            {cat.products.map((p) => (
              <div key={p.id} className="product">
                <div className="product-info">
                  <p className="product-name">{p.name}</p>
                  {p.description ? <p className="product-desc">{p.description}</p> : null}
                  <p className="product-price">{money(p.price)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setDetail(p)}>
                    Detalhes
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => addProduct(p)}>
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>

      {cartCount > 0 ? (
        <div className="fab-cart">
          <span>
            {cartCount} {cartCount === 1 ? "item" : "itens"} · {money(totals.total)}
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setDrawer(true)}>
            Ver carrinho
          </button>
        </div>
      ) : null}

      {detail ? (
        <div
          className="drawer-backdrop open"
          style={{ zIndex: 80 }}
          onClick={() => setDetail(null)}
          aria-hidden
        />
      ) : null}
      {detail ? (
        <div
          className="drawer open"
          role="dialog"
          aria-label="Detalhes do item"
          style={{ maxHeight: "70vh", zIndex: 90 }}
        >
          <div className="drawer-head">
            <strong>{detail.name}</strong>
            <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)}>
              Fechar
            </button>
          </div>
          <div className="drawer-body">
            {detail.description ? <p className="sub" style={{ marginTop: 0 }}>{detail.description}</p> : null}
            <p className="product-price">{money(detail.price)}</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => {
                addProduct(detail);
                setDetail(null);
              }}
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`drawer-backdrop ${drawer ? "open" : ""}`}
        onClick={() => !checkout && setDrawer(false)}
        aria-hidden
      />

      <div className={`drawer ${drawer ? "open" : ""}`} role="dialog" aria-label="Carrinho">
        <div className="drawer-head">
          <strong>{checkout ? "Checkout" : "Carrinho"}</strong>
          <button type="button" className="btn btn-ghost" onClick={() => (checkout ? setCheckout(false) : setDrawer(false))}>
            {checkout ? "Voltar" : "Fechar"}
          </button>
        </div>
        <div className="drawer-body">
          {!checkout ? (
            <>
              {Object.values(cart).map((line) => (
                <div key={line.product.id} className="line">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{line.product.name}</div>
                    <div className="sub" style={{ fontSize: "0.8rem" }}>
                      {money(line.product.price)} un
                    </div>
                    <input
                      placeholder="Obs. do item (ex: sem cebola)"
                      value={line.notes}
                      onChange={(e) =>
                        setCart((c) => ({
                          ...c,
                          [line.product.id]: { ...line, notes: e.target.value },
                        }))
                      }
                      style={{
                        marginTop: 6,
                        width: "100%",
                        padding: "0.45rem",
                        borderRadius: 8,
                        border: "1px solid var(--surface2)",
                        background: "var(--bg)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(line.product.id, line.quantity - 1)}>
                      −
                    </button>
                    <span style={{ minWidth: 22, textAlign: "center" }}>{line.quantity}</span>
                    <button type="button" onClick={() => setQty(line.product.id, line.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--surface2)" }}>
                <div className="line" style={{ border: "none", padding: "0.25rem 0" }}>
                  <span>Subtotal</span>
                  <span>{money(totals.sub)}</span>
                </div>
                <div className="line" style={{ border: "none", padding: "0.25rem 0" }}>
                  <span>Entrega</span>
                  <span>{deliveryType === "entrega" ? money(totals.fee) : "—"}</span>
                </div>
                <div className="line" style={{ border: "none", padding: "0.5rem 0", fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: "var(--success)" }}>{money(totals.total)}</span>
                </div>
              </div>
              <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setCheckout(true)}>
                Ir para checkout
              </button>
            </>
          ) : (
            <form className="form" onSubmit={onSubmitOrder}>
              <label htmlFor="nm">Nome</label>
              <input id="nm" value={name} onChange={(e) => setName(e.target.value)} required />

              <label htmlFor="ph">Telefone</label>
              <input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" />

              <label htmlFor="dt">Tipo</label>
              <select id="dt" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as "retirada" | "entrega")}>
                <option value="retirada">Retirada no balcão</option>
                <option value="entrega">Entrega</option>
              </select>

              {deliveryType === "entrega" ? (
                <>
                  <label htmlFor="ad">Endereço</label>
                  <input id="ad" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </>
              ) : null}

              <label htmlFor="pm">Pagamento</label>
              <select
                id="pm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as CreateOrderPayload["paymentMethod"])}
              >
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
                <option value="dinheiro">Dinheiro</option>
              </select>

              <label htmlFor="no">Observações do pedido</label>
              <textarea id="no" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Enviando…" : "Finalizar pedido"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
