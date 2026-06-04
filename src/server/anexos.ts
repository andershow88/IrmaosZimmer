"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Vínculo de um anexo a uma entidade do sistema. */
export type AnexoOwner = {
  serviceOrderId?: string | null;
  vehicleId?: string | null;
  inspectionId?: string | null;
};

/** Metadados do arquivo já salvo em disco (via saveUpload). */
export type AnexoMeta = {
  url: string;
  nome?: string | null;
  tipo?: string | null;
};

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const createSchema = z
  .object({
    url: z.string().trim().min(1, "Arquivo inválido."),
    nome: z.string().trim().optional().nullable(),
    tipo: z.string().trim().optional().nullable(),
    serviceOrderId: z.string().trim().optional().nullable(),
    vehicleId: z.string().trim().optional().nullable(),
    inspectionId: z.string().trim().optional().nullable(),
  })
  .refine(
    (d) => !!(d.serviceOrderId || d.vehicleId || d.inspectionId),
    "Informe a que registro o anexo pertence."
  );

export type CreateAnexoInput = z.infer<typeof createSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Caminho de revalidação conforme o dono do anexo. */
function revalidateOwner(owner: AnexoOwner) {
  if (owner.serviceOrderId) {
    revalidatePath(`/painel/ordens-servico/${owner.serviceOrderId}`);
  }
  if (owner.vehicleId) {
    revalidatePath(`/painel/veiculos/${owner.vehicleId}`);
  }
  if (owner.inspectionId) {
    revalidatePath(`/painel/checklists/${owner.inspectionId}`);
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Registra um anexo já enviado (a gravação física do arquivo acontece na rota
 * /api/upload via saveUpload). Esta action apenas persiste o registro no banco.
 */
export async function createAnexo(
  input: CreateAnexoInput
): Promise<ActionResult> {
  const user = await requireUserForAction();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  const anexo = await prisma.attachment.create({
    data: {
      url: data.url,
      nome: data.nome || null,
      tipo: data.tipo || null,
      serviceOrderId: data.serviceOrderId || null,
      vehicleId: data.vehicleId || null,
      inspectionId: data.inspectionId || null,
    },
    select: { id: true },
  });

  await logAudit(user.id, "CRIAR", "Attachment", anexo.id, data.url);

  revalidateOwner({
    serviceOrderId: data.serviceOrderId,
    vehicleId: data.vehicleId,
    inspectionId: data.inspectionId,
  });

  return { ok: true, id: anexo.id };
}

/** Exclui um anexo (registro + arquivo físico, best-effort). */
export async function deleteAnexo(id: string): Promise<ActionResult> {
  const user = await requireUserForAction();

  if (!id) {
    return { ok: false, error: "Anexo inválido." };
  }

  const anexo = await prisma.attachment.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      serviceOrderId: true,
      vehicleId: true,
      inspectionId: true,
    },
  });
  if (!anexo) {
    return { ok: false, error: "Anexo não encontrado." };
  }

  await prisma.attachment.delete({ where: { id } });

  // Remove o arquivo físico se estiver em /public/uploads (best-effort).
  if (anexo.url.startsWith("/uploads/")) {
    try {
      const nome = path.basename(anexo.url);
      await unlink(path.join(process.cwd(), "public", "uploads", nome));
    } catch {
      // Arquivo já removido ou inacessível — ignora.
    }
  }

  await logAudit(user.id, "EXCLUIR", "Attachment", id, null);

  revalidateOwner({
    serviceOrderId: anexo.serviceOrderId,
    vehicleId: anexo.vehicleId,
    inspectionId: anexo.inspectionId,
  });

  return { ok: true, id };
}
