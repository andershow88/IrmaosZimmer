"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { isValidCNPJ } from "@/lib/masks";

const ROUTE = "/painel/fornecedores";

const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do fornecedor."),
  cnpj: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || isValidCNPJ(v), "CNPJ inválido."),
  contato: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  telefone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido."),
  endereco: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type FornecedorActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return fornecedorSchema.safeParse({
    nome: formData.get("nome")?.toString() ?? "",
    cnpj: formData.get("cnpj")?.toString() ?? "",
    contato: formData.get("contato")?.toString() ?? "",
    telefone: formData.get("telefone")?.toString() ?? "",
    whatsapp: formData.get("whatsapp")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    endereco: formData.get("endereco")?.toString() ?? "",
    observacoes: formData.get("observacoes")?.toString() ?? "",
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

export async function createFornecedor(
  _prev: FornecedorActionState,
  formData: FormData
): Promise<FornecedorActionState> {
  await requireUserForAction();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  let id: string;
  try {
    const created = await prisma.supplier.create({
      data: parsed.data,
      select: { id: true },
    });
    id = created.id;
  } catch {
    return { ok: false, error: "Não foi possível salvar o fornecedor." };
  }

  revalidatePath(ROUTE);
  redirect(`${ROUTE}/${id}`);
}

export async function updateFornecedor(
  id: string,
  _prev: FornecedorActionState,
  formData: FormData
): Promise<FornecedorActionState> {
  await requireUserForAction();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await prisma.supplier.update({
      where: { id },
      data: parsed.data,
    });
  } catch {
    return { ok: false, error: "Não foi possível atualizar o fornecedor." };
  }

  revalidatePath(ROUTE);
  revalidatePath(`${ROUTE}/${id}`);
  redirect(`${ROUTE}/${id}`);
}

export async function deleteFornecedor(id: string): Promise<void> {
  await requireUserForAction();

  await prisma.supplier.delete({ where: { id } });

  revalidatePath(ROUTE);
  redirect(ROUTE);
}
