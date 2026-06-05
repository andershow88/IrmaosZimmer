import type { StatusOS } from "@prisma/client";

/**
 * Status de OS considerados "em aberto" (não finalizados) — usado para destacar
 * ordens ativas nos detalhes de cliente/veículo. Mantém ENTREGUE e CANCELADA de fora.
 */
export const STATUS_OS_ABERTAS = [
  "ABERTA",
  "AGUARDANDO_DIAGNOSTICO",
  "AGUARDANDO_APROVACAO",
  "APROVADA",
  "EM_EXECUCAO",
  "AGUARDANDO_PECAS",
  "CONCLUIDA",
] as const satisfies readonly StatusOS[];

export function isStatusOSAberta(status: string): boolean {
  return (STATUS_OS_ABERTAS as readonly string[]).includes(status);
}
