"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRoleForAction, type Role } from "@/lib/auth";

const ROUTE = "/configuracoes";

const ROLES = [
  "ADMINISTRADOR",
  "ATENDENTE",
  "MECANICO",
  "FINANCEIRO",
  "ESTOQUE",
] as const;

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const roleSchema = z.enum(ROLES, {
  message: "Selecione uma função válida.",
});

const baseUserSchema = {
  name: z.string().trim().min(2, "Informe o nome completo."),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("E-mail inválido."),
  role: roleSchema,
  ativo: z.boolean(),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo.")
    .optional()
    .or(z.literal("")),
};

const createSchema = z.object({
  ...baseUserSchema,
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

const updateSchema = z.object({
  ...baseUserSchema,
  id: z.string().min(1, "Usuário inválido."),
});

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

/** Cria um novo usuário com senha hasheada. */
export async function createUsuario(input: {
  name: string;
  email: string;
  role: string;
  ativo: boolean;
  telefone?: string;
  senha: string;
}): Promise<ActionResult> {
  await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Já existe um usuário com este e-mail." };
  }

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role as Role,
      ativo: data.ativo,
      telefone: data.telefone ? data.telefone : null,
      passwordHash: hashSync(data.senha, 10),
    },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Atualiza os dados de um usuário (sem alterar a senha). */
export async function updateUsuario(input: {
  id: string;
  name: string;
  email: string;
  role: string;
  ativo: boolean;
  telefone?: string;
}): Promise<ActionResult> {
  await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }
  const data = parsed.data;

  const usuario = await prisma.user.findUnique({
    where: { id: data.id },
    select: { id: true },
  });
  if (!usuario) {
    return { ok: false, error: "Usuário não encontrado." };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== data.id) {
    return { ok: false, error: "Já existe um usuário com este e-mail." };
  }

  await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role as Role,
      ativo: data.ativo,
      telefone: data.telefone ? data.telefone : null,
    },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Ativa ou desativa um usuário. */
export async function toggleAtivo(input: {
  id: string;
  ativo: boolean;
}): Promise<ActionResult> {
  const current = await requireRoleForAction(["ADMINISTRADOR"]);

  if (!input.id) {
    return { ok: false, error: "Usuário inválido." };
  }
  if (input.id === current.id && !input.ativo) {
    return { ok: false, error: "Você não pode desativar a si mesmo." };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!usuario) {
    return { ok: false, error: "Usuário não encontrado." };
  }

  await prisma.user.update({
    where: { id: input.id },
    data: { ativo: input.ativo },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Redefine a senha de um usuário. */
export async function resetSenha(input: {
  id: string;
  senha: string;
}): Promise<ActionResult> {
  await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = z
    .object({
      id: z.string().min(1, "Usuário inválido."),
      senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!usuario) {
    return { ok: false, error: "Usuário não encontrado." };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { passwordHash: hashSync(parsed.data.senha, 10) },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}
