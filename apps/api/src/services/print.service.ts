import { prisma } from "../lib/prisma.js";
import { buildThermalReceiptText } from "../print/receipt-text.js";
import { buildEscposPlaceholder } from "../print/escpos-stub.js";

const orderInclude = {
  customer: true,
  items: true,
} as const;

/**
 * Serviço de impressão desacoplado da rota HTTP: gera comanda e, no futuro, despacha para fila/driver.
 */
export async function getReceiptTextByOrderId(orderId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) return null;
  return buildThermalReceiptText(order);
}

/**
 * Retorno preparado para integração térmica: texto + buffer stub ESC/POS.
 */
export async function getReceiptPayload(orderId: string) {
  const text = await getReceiptTextByOrderId(orderId);
  if (!text) return null;
  const escpos = buildEscposPlaceholder(text);
  return {
    text,
    /** Base64 opcional para transporte na API se precisar */
    escposBase64: escpos.buffer.toString("base64"),
  };
}
