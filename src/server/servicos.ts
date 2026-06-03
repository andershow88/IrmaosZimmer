"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CategoriaServico } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoleForAction } from "@/lib/permissions-server";

const SERVICOS_ROLES = ["ESTOQUE", "ADMINISTRADOR"] as const;

const categoriaValues = Object.values(CategoriaServico) as [
  CategoriaServico,
  ...CategoriaServico[],
];

const servicoSchema = z.object({
  nome: z
    .string({ invalid_type_error: "Informe o nome do serviço." })
    .trim()
    .min(1, "Informe o nome do serviço.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  categoria: z.enum(categoriaValues, {
    errorMap: () => ({ message: "Selecione uma categoria válida." }),
  }),
  descricao: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2000 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  precoPadrao: z
    .number({ invalid_type_error: "Informe um preço válido." })
    .min(0, "O preço não pode ser negativo.")
    .max(9999999.99, "Preço acima do limite permitido."),
  tempoEstimadoMin: z
    .number({ invalid_type_error: "Informe um tempo válido." })
    .int("O tempo deve ser um número inteiro de minutos.")
    .min(0, "O tempo não pode ser negativo.")
    .max(100000, "Tempo acima do limite permitido.")
    .nullable(),
  ativo: z.boolean(),
});

export type ServicoActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

function parseInput(formData: FormData): ServicoActionState | z.infer<typeof servicoSchema> {
  const precoRaw = String(formData.get("precoPadrao") ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const tempoRaw = String(formData.get("tempoEstimadoMin") ?? "").trim();

  const parsed = servicoSchema.safeParse({
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    descricao: formData.get("descricao") ?? undefined,
    precoPadrao: precoRaw === "" ? NaN : Number(precoRaw),
    tempoEstimadoMin: tempoRaw === "" ? null : Number(tempoRaw),
    ativo: formData.get("ativo") === "on" || formData.get("ativo") === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, message: "Verifique os campos destacados.", errors };
  }

  return parsed.data;
}

function isErrorState(v: unknown): v is ServicoActionState {
  return typeof v === "object" && v !== null && "ok" in v;
}

export async function createServico(
  _prev: ServicoActionState,
  formData: FormData
): Promise<ServicoActionState> {
  await requireRoleForAction([...SERVICOS_ROLES]);

  const result = parseInput(formData);
  if (isErrorState(result)) return result;

  await prisma.service.create({
    data: {
      nome: result.nome,
      categoria: result.categoria,
      descricao: result.descricao,
      precoPadrao: result.precoPadrao,
      tempoEstimadoMin: result.tempoEstimadoMin,
      ativo: result.ativo,
    },
  });

  revalidatePath("/servicos");
  return { ok: true, message: "Serviço cadastrado com sucesso." };
}

export async function updateServico(
  id: string,
  _prev: ServicoActionState,
  formData: FormData
): Promise<ServicoActionState> {
  await requireRoleForAction([...SERVICOS_ROLES]);

  const result = parseInput(formData);
  if (isErrorState(result)) return result;

  await prisma.service.update({
    where: { id },
    data: {
      nome: result.nome,
      categoria: result.categoria,
      descricao: result.descricao,
      precoPadrao: result.precoPadrao,
      tempoEstimadoMin: result.tempoEstimadoMin,
      ativo: result.ativo,
    },
  });

  revalidatePath("/servicos");
  revalidatePath(`/servicos/${id}/editar`);
  return { ok: true, message: "Serviço atualizado com sucesso." };
}

export async function toggleAtivo(id: string): Promise<ServicoActionState> {
  await requireRoleForAction([...SERVICOS_ROLES]);

  const servico = await prisma.service.findUnique({
    where: { id },
    select: { ativo: true },
  });
  if (!servico) {
    return { ok: false, message: "Serviço não encontrado." };
  }

  await prisma.service.update({
    where: { id },
    data: { ativo: !servico.ativo },
  });

  revalidatePath("/servicos");
  return { ok: true, message: servico.ativo ? "Serviço desativado." : "Serviço ativado." };
}

export async function deleteServico(id: string): Promise<ServicoActionState> {
  await requireRoleForAction([...SERVICOS_ROLES]);

  const usos = await prisma.service.findUnique({
    where: { id },
    select: {
      _count: { select: { osItems: true, quoteItems: true } },
    },
  });

  if (!usos) {
    return { ok: false, message: "Serviço não encontrado." };
  }

  if (usos._count.osItems > 0 || usos._count.quoteItems > 0) {
    return {
      ok: false,
      message:
        "Não é possível excluir: este serviço está vinculado a ordens de serviço ou orçamentos. Desative-o em vez de excluir.",
    };
  }

  await prisma.service.delete({ where: { id } });

  revalidatePath("/servicos");
  return { ok: true, message: "Serviço excluído com sucesso." };
}
