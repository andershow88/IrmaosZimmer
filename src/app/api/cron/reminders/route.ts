import { gerarAvisos } from "@/server/avisos";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Endpoint de cron para gerar avisos (aniversário / revisão).
 *
 * Proteção (qualquer uma das opções):
 *  1. Header secreto: `x-cron-secret: <CRON_SECRET>` OU `Authorization: Bearer <CRON_SECRET>`,
 *     comparado com a env `CRON_SECRET`. Use isto em agendadores externos (Railway, cron-job.org).
 *  2. Sessão de usuário válida (cookie) — permite acionar manualmente pelo painel.
 *
 * Se `CRON_SECRET` não estiver definida, apenas a sessão é aceita (modo dev).
 * Aceita GET e POST. Retorna a contagem de avisos gerados.
 */
async function handle(req: Request): Promise<Response> {
  const autorizado = await isAuthorized(req);
  if (!autorizado) {
    return Response.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await gerarAvisos();
  return Response.json({ ok: true, ...resultado });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("x-cron-secret");
    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (header === secret || bearer === secret) return true;
  }
  // Fallback: sessão de usuário autenticado.
  const user = await getCurrentUser();
  return Boolean(user);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
