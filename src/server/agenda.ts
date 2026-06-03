"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import type { StatusAgendamento } from "@prisma/client";

const ROUTE = "/agenda";

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const STATUS_VALIDOS: StatusAgendamento[] = [
  "AGENDADO",
  "CONFIRMADO",
  "VEICULO_RECEBIDO",
  "NAO_COMPARECEU",
  "CANCELADO",
  "CONCLUIDO",
];

const agendamentoSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente."),
  vehicleId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  mecanicoId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  servicoDesejado: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  dataHora: z
    .string()
    .min(1, "Informe a data e a hora.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data/hora inválida."),
  duracaoMin: z.coerce
    .number()
    .int("Informe minutos inteiros.")
    .min(5, "Duração mínima de 5 minutos.")
    .max(1440, "Duração máxima de 24 horas."),
  observacoes: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
});

export type AgendaActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
};

function parseForm(formData: FormData) {
  return agendamentoSchema.safeParse({
    customerId: formData.get("customerId"),
    vehicleId: formData.get("vehicleId"),
    mecanicoId: formData.get("mecanicoId"),
    servicoDesejado: formData.get("servicoDesejado"),
    dataHora: formData.get("dataHora"),
    duracaoMin: formData.get("duracaoMin"),
    observacoes: formData.get("observacoes"),
  });
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Garante que o veículo (se informado) pertence ao cliente. */
async function validateVehicleOwnership(
  customerId: string,
  vehicleId: string | null
): Promise<boolean> {
  if (!vehicleId) return true;
  const v = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { customerId: true },
  });
  return !!v && v.customerId === customerId;
}

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

export async function createAgendamento(
  _prev: AgendaActionState,
  formData: FormData
): Promise<AgendaActionState> {
  await requireUserForAction();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  if (!(await validateVehicleOwnership(data.customerId, data.vehicleId))) {
    return {
      ok: false,
      error: "O veículo selecionado não pertence ao cliente.",
      fieldErrors: { vehicleId: "Veículo inválido para este cliente." },
    };
  }

  const created = await prisma.appointment.create({
    data: {
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      mecanicoId: data.mecanicoId,
      servicoDesejado: data.servicoDesejado,
      dataHora: new Date(data.dataHora),
      duracaoMin: data.duracaoMin,
      observacoes: data.observacoes,
    },
    select: { id: true },
  });

  revalidatePath(ROUTE);
  return { ok: true, id: created.id };
}

// ---------------------------------------------------------------------------
// Atualizar (editar dados do agendamento)
// ---------------------------------------------------------------------------

export async function updateAgendamento(
  id: string,
  _prev: AgendaActionState,
  formData: FormData
): Promise<AgendaActionState> {
  await requireUserForAction();

  if (!id) return { ok: false, error: "Agendamento não encontrado." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const data = parsed.data;

  if (!(await validateVehicleOwnership(data.customerId, data.vehicleId))) {
    return {
      ok: false,
      error: "O veículo selecionado não pertence ao cliente.",
      fieldErrors: { vehicleId: "Veículo inválido para este cliente." },
    };
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      mecanicoId: data.mecanicoId,
      servicoDesejado: data.servicoDesejado,
      dataHora: new Date(data.dataHora),
      duracaoMin: data.duracaoMin,
      observacoes: data.observacoes,
    },
  });

  revalidatePath(ROUTE);
  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Atualizar status
// ---------------------------------------------------------------------------

export async function updateStatusAgendamento(
  id: string,
  status: StatusAgendamento
): Promise<AgendaActionState> {
  await requireUserForAction();

  if (!id) return { ok: false, error: "Agendamento não encontrado." };
  if (!STATUS_VALIDOS.includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  revalidatePath(ROUTE);
  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true, id };
}
