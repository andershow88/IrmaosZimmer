"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRoleForAction, type Role } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

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

  const novo = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role as Role,
      ativo: data.ativo,
      telefone: data.telefone ? data.telefone : null,
      passwordHash: hashSync(data.senha, 10),
    },
  });

  await logAudit(
    actor.id,
    "CRIAR",
    "User",
    novo.id,
    `Usuário ${novo.name} (${novo.email}) criado com função ${novo.role}.`
  );

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
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

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

  await logAudit(
    actor.id,
    "ATUALIZAR",
    "User",
    data.id,
    `Usuário ${data.name} (${data.email}) atualizado; função ${data.role}.`
  );

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

  await logAudit(
    current.id,
    input.ativo ? "ATIVAR" : "DESATIVAR",
    "User",
    input.id,
    input.ativo ? "Usuário ativado." : "Usuário desativado."
  );

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Redefine a senha de um usuário. */
export async function resetSenha(input: {
  id: string;
  senha: string;
}): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

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

  await logAudit(
    actor.id,
    "REDEFINIR_SENHA",
    "User",
    parsed.data.id,
    "Senha redefinida pelo administrador."
  );

  revalidatePath(ROUTE);
  return { ok: true };
}

// ============================================================
// WorkshopSettings (dados cadastrais da oficina)
// ============================================================

export type WorkshopSettingsData = {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  logoUrl: string | null;
  horarios: string | null;
};

const workshopSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da oficina."),
  cnpj: z.string().trim().max(20, "CNPJ muito longo.").optional().or(z.literal("")),
  endereco: z.string().trim().max(200, "Endereço muito longo.").optional().or(z.literal("")),
  cidade: z.string().trim().max(120, "Cidade muito longa.").optional().or(z.literal("")),
  estado: z.string().trim().max(2, "Use a sigla do estado (ex.: RS).").optional().or(z.literal("")),
  cep: z.string().trim().max(10, "CEP inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().max(20, "Telefone muito longo.").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20, "WhatsApp muito longo.").optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().trim().max(500, "URL muito longa.").optional().or(z.literal("")),
  horarios: z.string().trim().max(2000, "Texto muito longo.").optional().or(z.literal("")),
});

/**
 * Retorna as configurações da oficina (registro único). Caso não exista,
 * retorna null para que a tela apresente o formulário em branco.
 */
export async function getWorkshopSettings(): Promise<WorkshopSettingsData | null> {
  const s = await prisma.workshopSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!s) return null;
  return {
    id: s.id,
    nome: s.nome,
    cnpj: s.cnpj,
    endereco: s.endereco,
    cidade: s.cidade,
    estado: s.estado,
    cep: s.cep,
    telefone: s.telefone,
    whatsapp: s.whatsapp,
    email: s.email,
    logoUrl: s.logoUrl,
    horarios: s.horarios,
  };
}

/** Cria ou atualiza o registro único de configurações da oficina. */
export async function saveWorkshopSettings(input: {
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  logoUrl?: string;
  horarios?: string;
}): Promise<ActionResult> {
  const actor = await requireRoleForAction(["ADMINISTRADOR"]);

  const parsed = workshopSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }
  const d = parsed.data;

  const empty = (v?: string) => (v && v.trim().length > 0 ? v.trim() : null);
  const data = {
    nome: d.nome.trim(),
    cnpj: empty(d.cnpj),
    endereco: empty(d.endereco),
    cidade: empty(d.cidade),
    estado: d.estado ? d.estado.trim().toUpperCase() : null,
    cep: empty(d.cep),
    telefone: empty(d.telefone),
    whatsapp: empty(d.whatsapp),
    email: empty(d.email)?.toLowerCase() ?? null,
    logoUrl: empty(d.logoUrl),
    horarios: empty(d.horarios),
  };

  const existing = await prisma.workshopSettings.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  let registroId: string;
  if (existing) {
    await prisma.workshopSettings.update({
      where: { id: existing.id },
      data,
    });
    registroId = existing.id;
  } else {
    const criado = await prisma.workshopSettings.create({ data });
    registroId = criado.id;
  }

  await logAudit(
    actor.id,
    existing ? "ATUALIZAR" : "CRIAR",
    "WorkshopSettings",
    registroId,
    `Dados da oficina ${existing ? "atualizados" : "cadastrados"}: ${data.nome}.`
  );

  revalidatePath(ROUTE);
  return { ok: true };
}
