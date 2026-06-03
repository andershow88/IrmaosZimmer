"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { isValidCPFCNPJ } from "@/lib/masks";

/** Resultado padronizado das Server Actions de clientes. */
export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Normaliza string vazia para null (campos opcionais). */
const optionalString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const clienteSchema = z
  .object({
    nome: z
      .string({ required_error: "Informe o nome do cliente." })
      .trim()
      .min(2, "O nome deve ter pelo menos 2 caracteres."),
    tipoPessoa: z.enum(["FISICA", "JURIDICA"], {
      errorMap: () => ({ message: "Tipo de pessoa inválido." }),
    }),
    cpfCnpj: optionalString,
    telefone: optionalString,
    whatsapp: optionalString,
    email: z.preprocess(
      (v) => {
        if (typeof v !== "string") return null;
        const t = v.trim();
        return t.length === 0 ? null : t;
      },
      z.string().email("E-mail inválido.").nullable()
    ),
    endereco: optionalString,
    cidade: optionalString,
    estado: optionalString,
    cep: optionalString,
    observacoes: optionalString,
    lgpdConsent: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.cpfCnpj) {
      const digits = onlyDigits(data.cpfCnpj);
      const expected = data.tipoPessoa === "FISICA" ? 11 : 14;
      if (digits.length !== expected || !isValidCPFCNPJ(data.cpfCnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cpfCnpj"],
          message:
            data.tipoPessoa === "FISICA"
              ? "CPF inválido."
              : "CNPJ inválido.",
        });
      }
    }
  });

export type ClienteInput = z.input<typeof clienteSchema>;

function parseFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.errors) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createCliente(input: ClienteInput): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos do formulário.",
      fieldErrors: parseFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const cliente = await prisma.customer.create({
    data: {
      nome: data.nome,
      tipoPessoa: data.tipoPessoa,
      cpfCnpj: data.cpfCnpj ?? null,
      telefone: data.telefone ?? null,
      whatsapp: data.whatsapp ?? null,
      email: data.email ?? null,
      endereco: data.endereco ?? null,
      cidade: data.cidade ?? null,
      estado: data.estado ?? null,
      cep: data.cep ?? null,
      observacoes: data.observacoes ?? null,
      lgpdConsent: data.lgpdConsent ?? false,
    },
    select: { id: true },
  });

  revalidatePath("/clientes");
  return { ok: true, id: cliente.id };
}

export async function updateCliente(
  id: string,
  input: ClienteInput
): Promise<ActionResult> {
  await requireUserForAction();

  if (!id) return { ok: false, error: "Cliente não encontrado." };

  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Verifique os campos do formulário.",
      fieldErrors: parseFieldErrors(parsed.error),
    };
  }

  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Cliente não encontrado." };

  const data = parsed.data;
  await prisma.customer.update({
    where: { id },
    data: {
      nome: data.nome,
      tipoPessoa: data.tipoPessoa,
      cpfCnpj: data.cpfCnpj ?? null,
      telefone: data.telefone ?? null,
      whatsapp: data.whatsapp ?? null,
      email: data.email ?? null,
      endereco: data.endereco ?? null,
      cidade: data.cidade ?? null,
      estado: data.estado ?? null,
      cep: data.cep ?? null,
      observacoes: data.observacoes ?? null,
      lgpdConsent: data.lgpdConsent ?? false,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true, id };
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  await requireUserForAction();

  if (!id) return { ok: false, error: "Cliente não encontrado." };

  const cliente = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { serviceOrders: true, quotes: true } },
    },
  });

  if (!cliente) return { ok: false, error: "Cliente não encontrado." };

  if (cliente._count.serviceOrders > 0 || cliente._count.quotes > 0) {
    return {
      ok: false,
      error:
        "Não é possível excluir: o cliente possui ordens de serviço ou orçamentos vinculados.",
    };
  }

  // Veículos e agendamentos são removidos em cascata pelo schema.
  await prisma.customer.delete({ where: { id } });

  revalidatePath("/clientes");
  return { ok: true, id };
}
