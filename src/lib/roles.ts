// Constantes e tipos de funções (Role) seguros para o cliente.
// Mantidos fora de "@/lib/auth" porque aquele módulo importa "next/headers"
// e prisma (server-only) — Client Components não podem arrastá-los para o bundle.

export type Role =
  | "ADMINISTRADOR"
  | "ATENDENTE"
  | "MECANICO"
  | "FINANCEIRO"
  | "ESTOQUE";

/** Rótulos em pt-BR para cada função. */
export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRADOR: "Administrador",
  ATENDENTE: "Atendente",
  MECANICO: "Mecânico",
  FINANCEIRO: "Financeiro",
  ESTOQUE: "Estoque",
};
