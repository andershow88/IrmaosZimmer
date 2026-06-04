import "server-only";

import { redirect } from "next/navigation";
import { requireUserForAction, type SessionUser } from "@/lib/auth";
import { can, type Modulo } from "@/lib/permissions";
import type { Role } from "@/lib/roles";

/**
 * Para Server Actions / rotas: exige sessão válida + uma das funções.
 * Lança erro em pt-BR (não redireciona) — apropriado para mutações.
 */
export async function requireRoleForAction(
  roles: Role[]
): Promise<SessionUser> {
  const user = await requireUserForAction();
  if (!roles.includes(user.role)) {
    throw new Error("Acesso negado: você não tem permissão para esta ação.");
  }
  return user;
}

/**
 * Para Server Actions / rotas: exige acesso a um módulo específico,
 * conforme a matriz de permissões. Lança erro em pt-BR.
 */
export async function requireModuleForAction(
  modulo: Modulo
): Promise<SessionUser> {
  const user = await requireUserForAction();
  if (!can(user.role, modulo)) {
    throw new Error("Acesso negado: você não tem permissão para esta ação.");
  }
  return user;
}

/**
 * Para Páginas (Server Components): exige uma das funções.
 * Redireciona para "/" se o usuário não tiver permissão (e para "/entrar"
 * se não houver sessão — herdado de requireUser via getCurrentUser).
 */
export async function requirePageRole(roles: Role[]): Promise<SessionUser> {
  // requireUserForAction lança se não autenticado; aqui preferimos redirecionar.
  let user: SessionUser;
  try {
    user = await requireUserForAction();
  } catch {
    redirect("/entrar");
  }
  if (!roles.includes(user.role)) {
    redirect("/painel");
  }
  return user;
}

/**
 * Para Páginas (Server Components): exige acesso a um módulo específico.
 * Redireciona para "/" se não tiver permissão.
 */
export async function requirePageModule(modulo: Modulo): Promise<SessionUser> {
  let user: SessionUser;
  try {
    user = await requireUserForAction();
  } catch {
    redirect("/entrar");
  }
  if (!can(user.role, modulo)) {
    redirect("/painel");
  }
  return user;
}
