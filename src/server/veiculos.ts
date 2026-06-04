"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";

const COMBUSTIVEIS = [
  "GASOLINA",
  "ETANOL",
  "FLEX",
  "DIESEL",
  "GNV",
  "ELETRICO",
  "HIBRIDO",
] as const;

const veiculoSchema = z.object({
  customerId: z.string().min(1, "Selecione o cliente."),
  placa: z
    .string()
    .trim()
    .min(1, "Informe a placa.")
    .transform((v) => v.toUpperCase()),
  marca: z.string().trim().min(1, "Informe a marca."),
  modelo: z.string().trim().min(1, "Informe o modelo."),
  ano: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    })
    .refine(
      (n) => n === null || (n >= 1900 && n <= new Date().getFullYear() + 1),
      "Ano inválido."
    ),
  cor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  quilometragem: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
    }),
  chassi: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : null)),
  renavam: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  combustivel: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || (COMBUSTIVEIS as readonly string[]).includes(v),
      "Combustível inválido."
    ),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type VeiculoActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return veiculoSchema.safeParse({
    customerId: formData.get("customerId"),
    placa: formData.get("placa"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    ano: formData.get("ano"),
    cor: formData.get("cor"),
    quilometragem: formData.get("quilometragem"),
    chassi: formData.get("chassi"),
    renavam: formData.get("renavam"),
    combustivel: formData.get("combustivel"),
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

export async function createVeiculo(
  _prev: VeiculoActionState,
  formData: FormData
): Promise<VeiculoActionState> {
  await requireUserForAction();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const data = parsed.data;
  const cliente = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true },
  });
  if (!cliente) {
    return { ok: false, error: "Cliente não encontrado." };
  }

  const veiculo = await prisma.vehicle.create({
    data: {
      customerId: data.customerId,
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      ano: data.ano,
      cor: data.cor,
      quilometragem: data.quilometragem,
      chassi: data.chassi,
      renavam: data.renavam,
      combustivel: data.combustivel as never,
      observacoes: data.observacoes,
    },
    select: { id: true },
  });

  revalidatePath("/painel/veiculos");
  redirect(`/painel/veiculos/${veiculo.id}`);
}

export async function updateVeiculo(
  id: string,
  _prev: VeiculoActionState,
  formData: FormData
): Promise<VeiculoActionState> {
  await requireUserForAction();

  const existente = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existente) {
    return { ok: false, error: "Veículo não encontrado." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const data = parsed.data;
  const cliente = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true },
  });
  if (!cliente) {
    return { ok: false, error: "Cliente não encontrado." };
  }

  await prisma.vehicle.update({
    where: { id },
    data: {
      customerId: data.customerId,
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      ano: data.ano,
      cor: data.cor,
      quilometragem: data.quilometragem,
      chassi: data.chassi,
      renavam: data.renavam,
      combustivel: data.combustivel as never,
      observacoes: data.observacoes,
    },
  });

  revalidatePath("/painel/veiculos");
  revalidatePath(`/painel/veiculos/${id}`);
  redirect(`/painel/veiculos/${id}`);
}

export async function deleteVeiculo(id: string): Promise<VeiculoActionState> {
  await requireUserForAction();

  const veiculo = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { serviceOrders: true, quotes: true } },
    },
  });
  if (!veiculo) {
    return { ok: false, error: "Veículo não encontrado." };
  }

  if (veiculo._count.serviceOrders > 0 || veiculo._count.quotes > 0) {
    return {
      ok: false,
      error:
        "Não é possível excluir: o veículo possui ordens de serviço ou orçamentos vinculados.",
    };
  }

  await prisma.vehicle.delete({ where: { id } });

  revalidatePath("/painel/veiculos");
  redirect("/painel/veiculos");
}
