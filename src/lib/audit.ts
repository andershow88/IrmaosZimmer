import "server-only";

import { prisma } from "@/lib/db";

// Registro de auditoria (trilha de ações). É "best-effort": NUNCA lança —
// auditoria não deve quebrar a operação principal. Em caso de erro, apenas
// loga no console.
//
// Requer o model `AuditLog` no schema Prisma. Caso ainda não exista no client
// gerado, a chamada falha silenciosamente (try/catch) e a aplicação segue.

export type LogAuditInput = {
  userId: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhe?: string | null;
};

/**
 * Grava uma entrada de auditoria. Nunca lança.
 * @param userId    Usuário que realizou a ação (ou null para sistema).
 * @param acao      Ação realizada (ex.: "CRIAR", "ATUALIZAR", "EXCLUIR").
 * @param entidade  Entidade afetada (ex.: "Customer", "ServiceOrder").
 * @param entidadeId  Id do registro afetado (opcional).
 * @param detalhe   Texto/JSON livre com detalhes (opcional).
 */
export async function logAudit(
  userId: string | null,
  acao: string,
  entidade: string,
  entidadeId?: string | null,
  detalhe?: string | null
): Promise<void> {
  try {
    // `as any` defensivo: o delegate só existe se o model AuditLog estiver no
    // schema/cliente gerado. Mantém compilável mesmo durante a migração.
    const delegate = (prisma as unknown as {
      auditLog?: {
        create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
      };
    }).auditLog;

    if (!delegate) return;

    await delegate.create({
      data: {
        userId: userId ?? undefined,
        acao,
        entidade,
        entidadeId: entidadeId ?? undefined,
        detalhe: detalhe ?? undefined,
      },
    });
  } catch (err) {
    // Nunca propaga — apenas registra para diagnóstico.
    console.error("[audit] falha ao registrar log:", err);
  }
}
