"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const createSchema = z.object({
  serviceOrderId: z.string().trim().min(1, "Ordem de serviço inválida."),
  descricao: z.string().trim().min(1, "Informe a descrição da garantia."),
  // input type="date" envia "" quando vazio; normalizamos para null.
  validadeAte: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  observacoes: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type CreateGarantiaInput = z.infer<typeof createSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converte uma data de input (yyyy-MM-dd) em Date (fim do dia local) ou null. */
function parseValidade(v: string | null): Date | null {
  if (!v) return null;
  // Considera a validade até o fim do dia informado.
  const d = new Date(`${v}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Cria uma garantia vinculada a uma ordem de serviço. */
export async function createGarantia(
  input: CreateGarantiaInput
): Promise<ActionResult> {
  const user = await requireUserForAction();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  const os = await prisma.serviceOrder.findUnique({
    where: { id: data.serviceOrderId },
    select: { id: true },
  });
  if (!os) {
    return { ok: false, error: "Ordem de serviço não encontrada." };
  }

  const garantia = await prisma.warranty.create({
    data: {
      serviceOrderId: data.serviceOrderId,
      descricao: data.descricao,
      validadeAte: parseValidade(data.validadeAte),
      observacoes: data.observacoes,
    },
    select: { id: true },
  });

  await logAudit(
    user.id,
    "CRIAR",
    "Warranty",
    garantia.id,
    `Garantia para OS ${data.serviceOrderId}`
  );

  revalidatePath(`/painel/ordens-servico/${data.serviceOrderId}`);
  return { ok: true, id: garantia.id };
}

/** Exclui uma garantia. */
export async function deleteGarantia(id: string): Promise<ActionResult> {
  const user = await requireUserForAction();

  if (!id) {
    return { ok: false, error: "Garantia inválida." };
  }

  const garantia = await prisma.warranty.findUnique({
    where: { id },
    select: { id: true, serviceOrderId: true },
  });
  if (!garantia) {
    return { ok: false, error: "Garantia não encontrada." };
  }

  await prisma.warranty.delete({ where: { id } });

  await logAudit(user.id, "EXCLUIR", "Warranty", id, null);

  revalidatePath(`/painel/ordens-servico/${garantia.serviceOrderId}`);
  return { ok: true, id };
}
