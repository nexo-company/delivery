/**
 * Stub para evolução ESC/POS (USB/Rede via node-escpos, escpos, ou raw TCP na impressora).
 *
 * Ideia da próxima fase:
 * - Montar bytes com comandos GS V (cut), align, bold, code page CP850/CP1252
 * - Enviar Buffer para impressora sem passar pelo navegador
 *
 * Este MVP não envia bytes reais; apenas documenta o contrato.
 */
export type EscposBuildResult = {
  /** Buffer pronto para socket/USB quando integrar driver */
  buffer: Buffer;
  /** Texto legível para debug */
  previewText: string;
};

export function buildEscposPlaceholder(previewText: string): EscposBuildResult {
  // Placeholder: UTF-8 como bytes (impressora real exigiria mapeamento de codepage)
  const buffer = Buffer.from(`\x1b@\n${previewText}\n\n\n`, "utf8");
  return { buffer, previewText };
}
