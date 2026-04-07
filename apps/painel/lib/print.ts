import { fetchReceiptText } from "./api";

/**
 * Abre janela com texto monoespaçado e dispara impressão do sistema.
 * Troca futura: enviar escposBase64 para agente local / driver térmico.
 */
export async function printOrderThermal(orderId: string): Promise<void> {
  const text = await fetchReceiptText(orderId);
  const w = window.open("", "_blank", "width=400,height=700");
  if (!w) {
    alert("Permita pop-ups para imprimir.");
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><title>Comanda ${orderId}</title>
  <style>
    body { font-family: ui-monospace, monospace; font-size: 12px; padding: 12px; white-space: pre-wrap; }
    @media print { body { padding: 0; } }
  </style></head><body><pre>${escapeHtml(text)}</pre>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
