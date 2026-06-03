// Matriz de permissões por função (Role) — SEGURA PARA O CLIENTE.
// NÃO importa "next/headers", prisma ou qualquer módulo server-only, para que
// possa ser usada tanto em Server Components quanto em Client Components
// (ex.: esconder itens de menu, desabilitar botões).
//
// A checagem real de autorização do lado do servidor fica em
// "@/lib/permissions-server" (requireRoleForAction / requirePageRole).

import { ROLE_LABELS, type Role } from "@/lib/roles";

// Re-export para conveniência: quem importa "permissions" geralmente também
// precisa dos rótulos.
export { ROLE_LABELS, type Role };

/**
 * Identificadores de módulos/áreas funcionais do sistema.
 * Use estes valores em `can(role, modulo)` e nos menus.
 */
export type Modulo =
  | "clientes"
  | "veiculos"
  | "agenda"
  | "ordens"
  | "orcamentos"
  | "checklists"
  | "pagamentos"
  | "financeiro"
  | "relatorios"
  | "estoque"
  | "servicos"
  | "fornecedores"
  | "compras"
  | "configuracoes"
  | "usuarios";

/** Lista completa de módulos (útil para iterar/montar menus). */
export const MODULOS: Modulo[] = [
  "clientes",
  "veiculos",
  "agenda",
  "ordens",
  "orcamentos",
  "checklists",
  "pagamentos",
  "financeiro",
  "relatorios",
  "estoque",
  "servicos",
  "fornecedores",
  "compras",
  "configuracoes",
  "usuarios",
];

/**
 * Matriz de permissões: para cada função, os módulos a que ela tem acesso.
 * ADMINISTRADOR tem acesso a tudo (lista completa).
 */
export const MODULE_PERMISSIONS: Record<Role, Modulo[]> = {
  ADMINISTRADOR: [...MODULOS],
  ATENDENTE: ["clientes", "veiculos", "agenda", "ordens", "orcamentos"],
  // MECÂNICO atua nas ordens (atribuídas a ele — filtro fica na consulta) e
  // nos checklists/inspeções.
  MECANICO: ["ordens", "checklists"],
  FINANCEIRO: ["pagamentos", "relatorios", "financeiro"],
  ESTOQUE: ["estoque", "servicos", "compras"],
};

/**
 * Verifica se a função tem acesso ao módulo informado.
 * Client-safe — pode ser chamada em qualquer lugar.
 */
export function can(role: Role | null | undefined, modulo: Modulo): boolean {
  if (!role) return false;
  return MODULE_PERMISSIONS[role]?.includes(modulo) ?? false;
}

/** Verifica se a função pode acessar QUALQUER um dos módulos informados. */
export function canAny(
  role: Role | null | undefined,
  modulos: Modulo[]
): boolean {
  if (!role) return false;
  return modulos.some((m) => can(role, m));
}

/** true se a função é ADMINISTRADOR. */
export function isAdmin(role: Role | null | undefined): boolean {
  return role === "ADMINISTRADOR";
}
