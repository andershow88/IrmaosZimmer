import type { FormaPagamento, StatusPagamento } from "@prisma/client";

/** Rótulos em pt-BR para cada forma de pagamento. */
export const FORMA_LABELS: Record<FormaPagamento, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

export const FORMA_OPTIONS = Object.entries(FORMA_LABELS) as [FormaPagamento, string][];

/** Rótulos em pt-BR para cada status de pagamento. */
export const STATUS_LABELS: Record<StatusPagamento, string> = {
  PENDENTE: "Pendente",
  PARCIAL: "Parcial",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [StatusPagamento, string][];

/** Resultado padronizado das server actions de pagamento. */
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Deriva o status automaticamente a partir dos valores pago/total.
 * Pura — pode ser usada tanto no cliente (preview) quanto no servidor.
 */
export function deriveStatus(valorTotal: number, valorPago: number): StatusPagamento {
  if (valorPago >= valorTotal && valorTotal > 0) return "PAGO";
  if (valorPago > 0 && valorPago < valorTotal) return "PARCIAL";
  if (valorTotal === 0 && valorPago > 0) return "PAGO";
  return "PENDENTE";
}
