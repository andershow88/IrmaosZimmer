"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { summarizeInspection, type InspectionItemInput } from "@/lib/ai";

/** Status válidos de um item de inspeção. */
const STATUS_ITEM = ["OK", "ATENCAO", "CRITICO", "NAO_VERIFICADO"] as const;

const itemSchema = z.object({
  item: z.string().trim().min(1, "Informe o nome do item."),
  status: z.enum(STATUS_ITEM),
  observacao: z.string().trim().optional().nullable(),
});

const createSchema = z.object({
  vehicleId: z.string().trim().min(1, "Selecione um veículo."),
  serviceOrderId: z.string().trim().optional().nullable(),
  mecanicoId: z.string().trim().optional().nullable(),
  observacoes: z.string().trim().optional().nullable(),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item à inspeção."),
});

export type CreateInspecaoInput = z.infer<typeof createSchema>;

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Cria uma nova inspeção com seus itens. */
export async function createInspecao(
  input: CreateInspecaoInput
): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  // Garante que o veículo existe.
  const veiculo = await prisma.vehicle.findUnique({
    where: { id: data.vehicleId },
    select: { id: true },
  });
  if (!veiculo) {
    return { ok: false, error: "Veículo não encontrado." };
  }

  const inspecao = await prisma.inspection.create({
    data: {
      vehicleId: data.vehicleId,
      serviceOrderId: data.serviceOrderId || null,
      mecanicoId: data.mecanicoId || null,
      observacoes: data.observacoes || null,
      items: {
        create: data.items.map((i) => ({
          item: i.item,
          status: i.status,
          observacao: i.observacao || null,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/checklists");
  return { ok: true, id: inspecao.id };
}

const updateItemSchema = z.object({
  itemId: z.string().trim().min(1),
  status: z.enum(STATUS_ITEM),
  observacao: z.string().trim().optional().nullable(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** Atualiza o status/observação de um item de inspeção. */
export async function updateItem(input: UpdateItemInput): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }
  const data = parsed.data;

  const item = await prisma.inspectionItem.findUnique({
    where: { id: data.itemId },
    select: { id: true, inspectionId: true },
  });
  if (!item) {
    return { ok: false, error: "Item não encontrado." };
  }

  await prisma.inspectionItem.update({
    where: { id: data.itemId },
    data: {
      status: data.status,
      observacao: data.observacao || null,
    },
  });

  revalidatePath(`/checklists/${item.inspectionId}`);
  revalidatePath("/checklists");
  return { ok: true, id: item.id };
}

/** Gera e salva o resumo de IA da inspeção. */
export async function gerarResumoIA(inspectionId: string): Promise<ActionResult> {
  const user = await requireUserForAction();

  if (!inspectionId) {
    return { ok: false, error: "Inspeção inválida." };
  }

  const inspecao = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      items: { select: { item: true, status: true, observacao: true } },
    },
  });
  if (!inspecao) {
    return { ok: false, error: "Inspeção não encontrada." };
  }

  const items: InspectionItemInput[] = inspecao.items.map((i) => ({
    item: i.item,
    status: i.status,
    observacao: i.observacao ?? undefined,
  }));

  const resumo = await summarizeInspection(items, user.id);

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { resumoIA: resumo },
  });

  revalidatePath(`/checklists/${inspectionId}`);
  return { ok: true, id: inspectionId };
}
