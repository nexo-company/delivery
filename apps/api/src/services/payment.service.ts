import type { PaymentMethod, PaymentStatus } from "@prisma/client";

/**
 * Camada de pagamento desacoplada: hoje simula decisões do MVP.
 * Próxima fase: integrar PSP (Pix/cartão), webhooks e idempotência por transactionId.
 */
export type PaymentDecision = {
  paymentStatus: PaymentStatus;
  /** Quando houver gateway, preencher com id externo */
  transactionId: string | null;
};

/**
 * Simula validação/processamento após criação do pedido.
 * - dinheiro: considerado pago na hora (comum em balcão).
 * - pix: pendente até confirmação (no MVP o painel pode marcar pago manualmente depois).
 * - cartao: pendente simulando autorização assíncrona.
 */
export function simulatePaymentProcessing(method: PaymentMethod): PaymentDecision {
  switch (method) {
    case "dinheiro":
      return { paymentStatus: "pago", transactionId: null };
    case "pix":
      return { paymentStatus: "pendente", transactionId: null };
    case "cartao":
      return { paymentStatus: "pendente", transactionId: null };
    default:
      return { paymentStatus: "pendente", transactionId: null };
  }
}

/**
 * Validação de entrada antes de persistir (gateway real validaria cartão, assinatura Pix, etc.).
 */
export function assertPaymentMethod(method: string): method is PaymentMethod {
  return method === "pix" || method === "cartao" || method === "dinheiro";
}
