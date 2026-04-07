"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase, fetchPanelOrders, patchOrderStatus, type PanelOrder } from "@/lib/api";
import { printOrderThermal } from "@/lib/print";
import { connectPanelSocket } from "@/lib/socket";
import { playNewOrderChime } from "@/lib/sound";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const PAY_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

const PAY_ST: Record<string, string> = {
  pendente: "Pag. pendente",
  pago: "Pago",
  falhou: "Pag. falhou",
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mergeOrders(list: PanelOrder[], incoming: PanelOrder): PanelOrder[] {
  const i = list.findIndex((o) => o.id === incoming.id);
  if (i === -1) return [incoming, ...list];
  const copy = [...list];
  copy[i] = incoming;
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function nextActions(status: string): { key: PanelOrder["orderStatus"]; label: string }[] {
  switch (status) {
    case "pendente":
      return [
        { key: "confirmado", label: "Aceitar" },
        { key: "cancelado", label: "Cancelar" },
      ];
    case "confirmado":
      return [
        { key: "em_preparo", label: "Em preparo" },
        { key: "cancelado", label: "Cancelar" },
      ];
    case "em_preparo":
      return [{ key: "pronto", label: "Marcar pronto" }];
    case "pronto":
      return [{ key: "entregue", label: "Entregue" }];
    default:
      return [];
  }
}

export default function PanelClient() {
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(() => {
    fetchPanelOrders()
      .then(setOrders)
      .catch(() => setErr("API indisponível. Rode a API em " + apiBase()));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = connectPanelSocket({
      onNew: (o) => {
        playNewOrderChime();
        setOrders((prev) => mergeOrders(prev, o));
      },
      onUpdated: (o) => {
        setOrders((prev) => mergeOrders(prev, o));
      },
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => {
      socket.disconnect();
    };
  }, []);

  const active = useMemo(
    () => orders.filter((o) => o.orderStatus !== "entregue" && o.orderStatus !== "cancelado"),
    [orders],
  );

  async function onStatus(id: string, orderStatus: PanelOrder["orderStatus"]) {
    try {
      const updated = await patchOrderStatus(id, orderStatus);
      setOrders((prev) => mergeOrders(prev, updated));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  if (err && orders.length === 0) {
    return (
      <div className="empty">
        <p>{err}</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>Pedidos — Cozinha / Caixa</h1>
        <span className="badge">{connected ? "Tempo real conectado" : "Conectando…"}</span>
        <span className="badge">
          {active.length} ativo{active.length === 1 ? "" : "s"}
        </span>
        <button type="button" className="btn" onClick={() => refresh()}>
          Atualizar lista
        </button>
      </header>

      <div className="grid">
        {orders.length === 0 ? (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            Nenhum pedido ainda. Finalize um pedido pelo site (porta 3000).
          </div>
        ) : (
          orders.map((o) => (
            <article key={o.id} className="card">
              <div className="card-top">
                <div>
                  <div className="order-id">#{o.id.slice(-8).toUpperCase()}</div>
                  <div className="time">{new Date(o.createdAt).toLocaleString("pt-BR")}</div>
                </div>
                <span className={`status-pill st-${o.orderStatus}`}>{STATUS_LABEL[o.orderStatus] ?? o.orderStatus}</span>
              </div>
              <div className="row">
                <strong>Cliente</strong>
                {o.customer.name} · {o.customer.phone}
              </div>
              <div className="row">
                <strong>Tipo</strong>
                {o.deliveryType === "entrega" ? "Entrega" : "Retirada"}
              </div>
              {o.address ? (
                <div className="row">
                  <strong>Endereço</strong>
                  {o.address}
                </div>
              ) : null}
              {o.notes ? (
                <div className="row">
                  <strong>Obs.</strong>
                  {o.notes}
                </div>
              ) : null}
              <div className="row">
                <strong>Pagamento</strong>
                {PAY_LABEL[o.paymentMethod] ?? o.paymentMethod} · {PAY_ST[o.paymentStatus] ?? o.paymentStatus}
              </div>
              <ul className="items">
                {o.items.map((it, idx) => (
                  <li key={idx}>
                    {it.quantity}× {it.productNameSnapshot} — {money(it.unitPrice * it.quantity)}
                    {it.notes ? <div className="sub" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>({it.notes})</div> : null}
                  </li>
                ))}
              </ul>
              <div className="row">
                <strong>Total</strong>
                {money(o.total)}
              </div>
              <div className="actions">
                <button type="button" className="btn btn-print" onClick={() => void printOrderThermal(o.id)}>
                  Imprimir
                </button>
                {nextActions(o.orderStatus).map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={a.key === "cancelado" ? "btn btn-danger" : "btn btn-primary"}
                    onClick={() => void onStatus(o.id, a.key)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
