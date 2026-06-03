import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/upload";
import { createAnexo } from "@/server/anexos";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Upload de anexos (imagens/PDF) vinculados a uma OS, veículo ou inspeção.
 *
 * Espera multipart/form-data com:
 *  - file:            o arquivo (obrigatório)
 *  - serviceOrderId | vehicleId | inspectionId: ao menos um (vínculo).
 *
 * Salva o arquivo em /public/uploads (saveUpload) e cria o registro Attachment.
 * Retorna { ok, id, url, nome, tipo } em sucesso, ou { error } com status.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Limita uploads por usuário para evitar abuso.
  const limited = rateLimit(`upload:${session.id}`, 30, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitos envios. Aguarde um instante e tente novamente." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const serviceOrderId = (form.get("serviceOrderId") as string | null) || null;
  const vehicleId = (form.get("vehicleId") as string | null) || null;
  const inspectionId = (form.get("inspectionId") as string | null) || null;

  if (!serviceOrderId && !vehicleId && !inspectionId) {
    return Response.json(
      { error: "Informe a que registro o anexo pertence." },
      { status: 400 }
    );
  }

  // Grava o arquivo em disco (valida tipo/tamanho — lança Error em pt-BR).
  let saved;
  try {
    saved = await saveUpload(file);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Falha ao enviar o arquivo.";
    return Response.json({ error: msg }, { status: 400 });
  }

  // Persiste o registro Attachment.
  const res = await createAnexo({
    url: saved.url,
    nome: saved.nome,
    tipo: saved.tipo,
    serviceOrderId,
    vehicleId,
    inspectionId,
  });

  if (!res.ok) {
    return Response.json({ error: res.error }, { status: 400 });
  }

  return Response.json({
    ok: true,
    id: res.id,
    url: saved.url,
    nome: saved.nome,
    tipo: saved.tipo,
  });
}
