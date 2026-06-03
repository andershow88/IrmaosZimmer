"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import type { StatusPagamento } from "@prisma/client";
import { deriveStatus, type ActionResult } from "@/components/pagamentos/constants";

// ---------------------------------------------------------------------------
// Validação (pt-BR)
// ---------------------------------------------------------------------------

const FORMAS = [
  "PIX",
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "BOLETO",
  "OUTRO",
] as const;

const STATUS_MANUAIS = ["VENCIDO", "CANCELADO"] as const;

const registrarSchema = z.object({
  serviceOrderId: z.string().min(1, "Selecione a ordem de serviço."),
  valorTotal: z.coerce
    .number({ invalid_type_error: "Informe o valor total." })
    .nonnegative("O valor total não pode ser negativo."),
  valorPago: z.coerce
    .number({ invalid_type_error: "Informe o valor pago." })
    .nonnegative("O valor pago não pode ser negativo."),
  forma: z.enum(FORMAS, { errorMap: () => ({ message: "Selecione a forma de pagamento." }) }),
  dataPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

const updateSchema = registrarSchema.extend({
  id: z.string().min(1),
  statusManual: z.enum(STATUS_MANUAIS).optional(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Registra um novo pagamento, derivando o status pelos valores. */
export async function registrarPagamento(formData: FormData): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = registrarSchema.safeParse({
    serviceOrderId: formData.get("serviceOrderId"),
    valorTotal: formData.get("valorTotal"),
    valorPago: formData.get("valorPago"),
    forma: formData.get("forma"),
    dataPagamento: formData.get("dataPagamento") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  if (data.valorPago > data.valorTotal) {
    return { ok: false, error: "O valor pago não pode ser maior que o valor total." };
  }

  const os = await prisma.serviceOrder.findUnique({ where: { id: data.serviceOrderId } });
  if (!os) return { ok: false, error: "Ordem de serviço não encontrada." };

  const status = deriveStatus(data.valorTotal, data.valorPago);

  const created = await prisma.payment.create({
    data: {
      serviceOrderId: data.serviceOrderId,
      valorTotal: data.valorTotal,
      valorPago: data.valorPago,
      forma: data.forma,
      status,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      observacoes: data.observacoes ?? null,
    },
  });

  revalidatePath("/pagamentos");
  return { ok: true, id: created.id };
}

/** Atualiza um pagamento existente. Permite forçar VENCIDO/CANCELADO. */
export async function updatePagamento(formData: FormData): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    serviceOrderId: formData.get("serviceOrderId"),
    valorTotal: formData.get("valorTotal"),
    valorPago: formData.get("valorPago"),
    forma: formData.get("forma"),
    dataPagamento: formData.get("dataPagamento") || undefined,
    observacoes: formData.get("observacoes") || undefined,
    statusManual: formData.get("statusManual") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  if (data.valorPago > data.valorTotal) {
    return { ok: false, error: "O valor pago não pode ser maior que o valor total." };
  }

  const existing = await prisma.payment.findUnique({ where: { id: data.id } });
  if (!existing) return { ok: false, error: "Pagamento não encontrado." };

  const status: StatusPagamento = data.statusManual
    ? data.statusManual
    : deriveStatus(data.valorTotal, data.valorPago);

  await prisma.payment.update({
    where: { id: data.id },
    data: {
      serviceOrderId: data.serviceOrderId,
      valorTotal: data.valorTotal,
      valorPago: data.valorPago,
      forma: data.forma,
      status,
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      observacoes: data.observacoes ?? null,
    },
  });

  revalidatePath("/pagamentos");
  revalidatePath(`/pagamentos/${data.id}`);
  return { ok: true, id: data.id };
}

/** Exclui um pagamento. */
export async function deletePagamento(id: string): Promise<ActionResult> {
  await requireUserForAction();

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Pagamento não encontrado." };

  await prisma.payment.delete({ where: { id } });

  revalidatePath("/pagamentos");
  return { ok: true, id };
}
