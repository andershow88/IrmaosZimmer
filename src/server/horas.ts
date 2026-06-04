"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const ROUTE = "/painel/ordens-servico";

/** Diferença em minutos (arredondada) entre dois instantes. Nunca negativa. */
function diffMinutos(inicio: Date, fim: Date): number {
  const ms = fim.getTime() - inicio.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms / 60000);
}

// ---------------------------------------------------------------------------
// iniciarApontamento — abre um TimeEntry para o mecânico logado.
// ---------------------------------------------------------------------------

export async function iniciarApontamento(
  serviceOrderId: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUserForAction();

  if (!serviceOrderId) {
    return { ok: false, error: "Ordem de serviço inválida." };
  }

  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    select: { id: true, numero: true },
  });
  if (!os) return { ok: false, error: "Ordem de serviço não encontrada." };

  // Evita dois apontamentos abertos do mesmo mecânico na mesma OS.
  const aberto = await prisma.timeEntry.findFirst({
    where: { serviceOrderId, userId: user.id, fim: null },
    select: { id: true },
  });
  if (aberto) {
    return { ok: false, error: "Você já tem um apontamento em andamento nesta OS." };
  }

  const entry = await prisma.timeEntry.create({
    data: {
      serviceOrderId,
      userId: user.id,
      inicio: new Date(),
      fim: null,
    },
  });

  await logAudit(
    user.id,
    "CRIAR",
    "TimeEntry",
    entry.id,
    `Apontamento iniciado na OS ${os.numero}.`
  );

  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  return { ok: true, id: entry.id };
}

// ---------------------------------------------------------------------------
// pararApontamento — fecha o TimeEntry e grava os minutos.
// ---------------------------------------------------------------------------

export async function pararApontamento(
  timeEntryId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserForAction();

  if (!timeEntryId) {
    return { ok: false, error: "Apontamento inválido." };
  }

  const entry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    select: { id: true, serviceOrderId: true, userId: true, inicio: true, fim: true },
  });
  if (!entry) return { ok: false, error: "Apontamento não encontrado." };
  if (entry.fim) return { ok: false, error: "Este apontamento já foi encerrado." };

  const fim = new Date();
  const minutos = diffMinutos(entry.inicio, fim);

  await prisma.timeEntry.update({
    where: { id: timeEntryId },
    data: { fim, minutos },
  });

  await logAudit(
    user.id,
    "ATUALIZAR",
    "TimeEntry",
    timeEntryId,
    `Apontamento encerrado (${minutos} min).`
  );

  revalidatePath(`${ROUTE}/${entry.serviceOrderId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// registrarManual — lança um período já fechado (sem cronômetro).
// ---------------------------------------------------------------------------

const registrarManualSchema = z.object({
  minutos: z.coerce.number().int().min(1, "Informe a duração em minutos."),
  observacao: z.string().trim().optional(),
});

export async function registrarManual(
  serviceOrderId: string,
  minutos: number,
  observacao?: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserForAction();

  if (!serviceOrderId) {
    return { ok: false, error: "Ordem de serviço inválida." };
  }

  const parsed = registrarManualSchema.safeParse({ minutos, observacao });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    select: { id: true, numero: true },
  });
  if (!os) return { ok: false, error: "Ordem de serviço não encontrada." };

  const inicio = new Date();
  const fim = new Date(inicio.getTime() + parsed.data.minutos * 60000);

  const entry = await prisma.timeEntry.create({
    data: {
      serviceOrderId,
      userId: user.id,
      inicio,
      fim,
      minutos: parsed.data.minutos,
      observacao: parsed.data.observacao || null,
    },
  });

  await logAudit(
    user.id,
    "CRIAR",
    "TimeEntry",
    entry.id,
    `Apontamento manual de ${parsed.data.minutos} min na OS ${os.numero}.`
  );

  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  return { ok: true };
}
