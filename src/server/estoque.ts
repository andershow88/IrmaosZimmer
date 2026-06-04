"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRoleForAction } from "@/lib/permissions-server";

const ESTOQUE_ROLES = ["ESTOQUE", "ADMINISTRADOR"] as const;

// ============================================================
// Tipos de retorno das Server Actions
// ============================================================

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

// ============================================================
// Validação (zod) — mensagens em pt-BR
// ============================================================

const moneySchema = z
  .number({ invalid_type_error: "Informe um valor válido." })
  .min(0, "O valor não pode ser negativo.");

const pecaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da peça."),
  codigoInterno: z.string().trim().min(1, "Informe o código interno."),
  categoria: z.string().trim().optional().nullable(),
  supplierId: z.string().trim().optional().nullable(),
  precoCusto: moneySchema,
  precoVenda: moneySchema,
  quantidade: z
    .number({ invalid_type_error: "Informe a quantidade." })
    .int("A quantidade deve ser um número inteiro.")
    .min(0, "A quantidade não pode ser negativa."),
  estoqueMinimo: z
    .number({ invalid_type_error: "Informe o estoque mínimo." })
    .int("O estoque mínimo deve ser um número inteiro.")
    .min(0, "O estoque mínimo não pode ser negativo."),
  localizacao: z.string().trim().optional().nullable(),
  compatibilidade: z.string().trim().optional().nullable(),
});

const movimentacaoSchema = z.object({
  partId: z.string().trim().min(1, "Selecione uma peça."),
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"], {
    errorMap: () => ({ message: "Selecione um tipo de movimentação." }),
  }),
  quantidade: z
    .number({ invalid_type_error: "Informe a quantidade." })
    .int("A quantidade deve ser um número inteiro.")
    .positive("A quantidade deve ser maior que zero."),
  motivo: z.string().trim().optional().nullable(),
});

// ============================================================
// Helpers
// ============================================================

function num(value: FormDataEntryValue | null): number {
  if (value === null) return NaN;
  const raw = String(value).trim().replace(/\./g, "").replace(",", ".");
  // Suporta tanto "1234.56" quanto "1.234,56".
  const direct = Number(String(value).trim());
  const parsed = Number(raw);
  return Number.isFinite(direct) && !String(value).includes(",")
    ? direct
    : parsed;
}

function str(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function optStr(value: FormDataEntryValue | null): string | null {
  const s = str(value);
  return s.length > 0 ? s : null;
}

// ============================================================
// Peças (Part)
// ============================================================

export async function createPeca(formData: FormData): Promise<ActionResult> {
  await requireRoleForAction([...ESTOQUE_ROLES]);

  const parsed = pecaSchema.safeParse({
    nome: str(formData.get("nome")),
    codigoInterno: str(formData.get("codigoInterno")),
    categoria: optStr(formData.get("categoria")),
    supplierId: optStr(formData.get("supplierId")),
    precoCusto: num(formData.get("precoCusto")),
    precoVenda: num(formData.get("precoVenda")),
    quantidade: num(formData.get("quantidade")),
    estoqueMinimo: num(formData.get("estoqueMinimo")),
    localizacao: optStr(formData.get("localizacao")),
    compatibilidade: optStr(formData.get("compatibilidade")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  try {
    await prisma.part.create({
      data: {
        nome: data.nome,
        codigoInterno: data.codigoInterno,
        categoria: data.categoria ?? null,
        supplierId: data.supplierId ?? null,
        precoCusto: data.precoCusto,
        precoVenda: data.precoVenda,
        quantidade: data.quantidade,
        estoqueMinimo: data.estoqueMinimo,
        localizacao: data.localizacao ?? null,
        compatibilidade: data.compatibilidade ?? null,
      },
    });
  } catch (e) {
    return { ok: false, error: codeError(e) };
  }

  revalidatePath("/painel/estoque");
  return { ok: true };
}

export async function updatePeca(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireRoleForAction([...ESTOQUE_ROLES]);

  if (!id) return { ok: false, error: "Peça não encontrada." };

  const parsed = pecaSchema.safeParse({
    nome: str(formData.get("nome")),
    codigoInterno: str(formData.get("codigoInterno")),
    categoria: optStr(formData.get("categoria")),
    supplierId: optStr(formData.get("supplierId")),
    precoCusto: num(formData.get("precoCusto")),
    precoVenda: num(formData.get("precoVenda")),
    quantidade: num(formData.get("quantidade")),
    estoqueMinimo: num(formData.get("estoqueMinimo")),
    localizacao: optStr(formData.get("localizacao")),
    compatibilidade: optStr(formData.get("compatibilidade")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  try {
    await prisma.part.update({
      where: { id },
      data: {
        nome: data.nome,
        codigoInterno: data.codigoInterno,
        categoria: data.categoria ?? null,
        supplierId: data.supplierId ?? null,
        precoCusto: data.precoCusto,
        precoVenda: data.precoVenda,
        quantidade: data.quantidade,
        estoqueMinimo: data.estoqueMinimo,
        localizacao: data.localizacao ?? null,
        compatibilidade: data.compatibilidade ?? null,
      },
    });
  } catch (e) {
    return { ok: false, error: codeError(e) };
  }

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${id}/editar`);
  return { ok: true };
}

export async function deletePeca(id: string): Promise<ActionResult> {
  await requireRoleForAction([...ESTOQUE_ROLES]);

  if (!id) return { ok: false, error: "Peça não encontrada." };

  try {
    await prisma.part.delete({ where: { id } });
  } catch {
    return {
      ok: false,
      error:
        "Não foi possível excluir esta peça. Verifique se ela não está vinculada a ordens ou orçamentos.",
    };
  }

  revalidatePath("/painel/estoque");
  return { ok: true };
}

// ============================================================
// Movimentações de estoque (InventoryMovement)
// ============================================================

export async function registrarMovimentacao(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRoleForAction([...ESTOQUE_ROLES]);

  const parsed = movimentacaoSchema.safeParse({
    partId: str(formData.get("partId")),
    tipo: str(formData.get("tipo")),
    quantidade: num(formData.get("quantidade")),
    motivo: optStr(formData.get("motivo")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { partId, tipo, quantidade, motivo } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({
        where: { id: partId },
        select: { id: true, quantidade: true },
      });
      if (!part) throw new Error("Peça não encontrada.");

      let novaQuantidade: number;
      if (tipo === "ENTRADA") {
        novaQuantidade = part.quantidade + quantidade;
      } else if (tipo === "SAIDA") {
        novaQuantidade = part.quantidade - quantidade;
        if (novaQuantidade < 0) {
          throw new Error(
            `Estoque insuficiente. Disponível: ${part.quantidade}.`
          );
        }
      } else {
        // AJUSTE: define o novo saldo absoluto.
        novaQuantidade = quantidade;
      }

      await tx.inventoryMovement.create({
        data: {
          partId,
          tipo,
          quantidade,
          motivo: motivo ?? null,
          createdById: user.id,
        },
      });

      await tx.part.update({
        where: { id: partId },
        data: { quantidade: novaQuantidade },
      });
    });
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Não foi possível registrar a movimentação.",
    };
  }

  revalidatePath("/painel/estoque/movimentacoes");
  revalidatePath("/painel/estoque");
  return { ok: true };
}

// ============================================================
// Tratamento de erros do Prisma
// ============================================================

function codeError(e: unknown): string {
  if (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  ) {
    return "Já existe uma peça com este código interno.";
  }
  return "Não foi possível salvar a peça.";
}
