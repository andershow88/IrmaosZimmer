"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { explainQuote } from "@/lib/ai";
import type { Prisma, StatusOrcamento, TipoItem } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gera o próximo número de orçamento no formato ORC-AAAA-#### (sequencial anual). */
async function gerarNumeroOrcamento(): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = `ORC-${ano}-`;
  const ultimo = await prisma.quote.findFirst({
    where: { numero: { startsWith: prefixo } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  let seq = 1;
  if (ultimo) {
    const n = Number.parseInt(ultimo.numero.slice(prefixo.length), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefixo}${String(seq).padStart(4, "0")}`;
}

/** Gera o próximo número de OS no formato OS-AAAA-#### (sequencial anual). */
async function gerarNumeroOS(): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = `OS-${ano}-`;
  const ultimo = await prisma.serviceOrder.findFirst({
    where: { numero: { startsWith: prefixo } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  let seq = 1;
  if (ultimo) {
    const n = Number.parseInt(ultimo.numero.slice(prefixo.length), 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefixo}${String(seq).padStart(4, "0")}`;
}

/** Recalcula e persiste o total do orçamento (soma dos subtotais - desconto). */
async function recalcularTotal(
  tx: Prisma.TransactionClient,
  quoteId: string
): Promise<number> {
  const quote = await tx.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });
  if (!quote) throw new Error("Orçamento não encontrado.");

  const somaItens = quote.items.reduce(
    (acc, item) => acc + Number(item.subtotal),
    0
  );
  const desconto = Number(quote.desconto);
  const total = Math.max(0, somaItens - desconto);

  await tx.quote.update({
    where: { id: quoteId },
    data: { total },
  });
  return total;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const itemSchema = z.object({
  tipo: z.enum(["SERVICO", "PECA"]),
  serviceId: z.string().optional().nullable(),
  partId: z.string().optional().nullable(),
  descricao: z.string().min(1, "Informe a descrição do item."),
  quantidade: z.coerce.number().int().min(1, "Quantidade deve ser ao menos 1."),
  precoUnitario: z.coerce.number().min(0, "Preço inválido."),
});

const createSchema = z
  .object({
    serviceOrderId: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    vehicleId: z.string().optional().nullable(),
    validade: z.string().optional().nullable(),
    desconto: z.coerce.number().min(0).default(0),
    observacoes: z.string().optional().nullable(),
    itens: z.array(itemSchema).min(1, "Adicione ao menos um item."),
  })
  .refine(
    (d) => Boolean(d.serviceOrderId) || (Boolean(d.customerId) && Boolean(d.vehicleId)),
    {
      message: "Selecione uma OS ou informe cliente e veículo.",
      path: ["customerId"],
    }
  );

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// createOrcamento
// ---------------------------------------------------------------------------

export async function createOrcamento(input: unknown): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  // Resolve cliente/veículo a partir da OS, se informada.
  let customerId = data.customerId ?? null;
  let vehicleId = data.vehicleId ?? null;
  const serviceOrderId = data.serviceOrderId ?? null;

  if (serviceOrderId) {
    const os = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { customerId: true, vehicleId: true },
    });
    if (!os) return { ok: false, error: "Ordem de serviço não encontrada." };
    customerId = os.customerId;
    vehicleId = os.vehicleId;
  }

  if (!customerId || !vehicleId) {
    return { ok: false, error: "Cliente e veículo são obrigatórios." };
  }

  const somaItens = data.itens.reduce(
    (acc, i) => acc + i.quantidade * i.precoUnitario,
    0
  );
  const total = Math.max(0, somaItens - data.desconto);

  let novoId: string;
  try {
    const numero = await gerarNumeroOrcamento();
    const quote = await prisma.quote.create({
      data: {
        numero,
        serviceOrderId,
        customerId,
        vehicleId,
        status: "RASCUNHO",
        validade: data.validade ? new Date(data.validade) : null,
        desconto: data.desconto,
        total,
        observacoes: data.observacoes || null,
        items: {
          create: data.itens.map((i) => ({
            tipo: i.tipo as TipoItem,
            serviceId: i.tipo === "SERVICO" ? i.serviceId || null : null,
            partId: i.tipo === "PECA" ? i.partId || null : null,
            descricao: i.descricao,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
            subtotal: i.quantidade * i.precoUnitario,
          })),
        },
      },
      select: { id: true },
    });
    novoId = quote.id;
  } catch {
    return { ok: false, error: "Não foi possível criar o orçamento." };
  }

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${novoId}`);
}

// ---------------------------------------------------------------------------
// updateOrcamento (edição de cabeçalho: validade, desconto, observações)
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  id: z.string().min(1),
  validade: z.string().optional().nullable(),
  desconto: z.coerce.number().min(0).default(0),
  observacoes: z.string().optional().nullable(),
});

export async function updateOrcamento(input: unknown): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, validade, desconto, observacoes } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id },
        data: {
          validade: validade ? new Date(validade) : null,
          desconto,
          observacoes: observacoes || null,
        },
      });
      await recalcularTotal(tx, id);
    });
  } catch {
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// addItem / removeItem / recalcular
// ---------------------------------------------------------------------------

const addItemSchema = itemSchema.extend({ quoteId: z.string().min(1) });

export async function addItem(input: unknown): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Item inválido." };
  }
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.quoteItem.create({
        data: {
          quoteId: data.quoteId,
          tipo: data.tipo as TipoItem,
          serviceId: data.tipo === "SERVICO" ? data.serviceId || null : null,
          partId: data.tipo === "PECA" ? data.partId || null : null,
          descricao: data.descricao,
          quantidade: data.quantidade,
          precoUnitario: data.precoUnitario,
          subtotal: data.quantidade * data.precoUnitario,
        },
      });
      await recalcularTotal(tx, data.quoteId);
    });
  } catch {
    return { ok: false, error: "Não foi possível adicionar o item." };
  }

  revalidatePath(`/orcamentos/${data.quoteId}`);
  return { ok: true, id: data.quoteId };
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  await requireUserForAction();
  if (!itemId) return { ok: false, error: "Item inválido." };

  try {
    const quoteId = await prisma.$transaction(async (tx) => {
      const item = await tx.quoteItem.findUnique({
        where: { id: itemId },
        select: { quoteId: true },
      });
      if (!item) throw new Error("Item não encontrado.");
      await tx.quoteItem.delete({ where: { id: itemId } });
      await recalcularTotal(tx, item.quoteId);
      return item.quoteId;
    });
    revalidatePath(`/orcamentos/${quoteId}`);
    return { ok: true, id: quoteId };
  } catch {
    return { ok: false, error: "Não foi possível remover o item." };
  }
}

/** Recalcula o total a partir dos itens atuais (uso manual). */
export async function recalcular(quoteId: string): Promise<ActionResult> {
  await requireUserForAction();
  if (!quoteId) return { ok: false, error: "Orçamento inválido." };

  try {
    await prisma.$transaction((tx) => recalcularTotal(tx, quoteId));
  } catch {
    return { ok: false, error: "Não foi possível recalcular o total." };
  }
  revalidatePath(`/orcamentos/${quoteId}`);
  return { ok: true, id: quoteId };
}

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

/** Transições de status permitidas. */
const TRANSICOES: Record<StatusOrcamento, StatusOrcamento[]> = {
  RASCUNHO: ["ENVIADO"],
  ENVIADO: ["APROVADO", "REJEITADO", "EXPIRADO"],
  APROVADO: [],
  REJEITADO: [],
  EXPIRADO: ["ENVIADO"],
};

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "REJEITADO", "EXPIRADO"]),
});

export async function updateStatus(input: unknown): Promise<ActionResult> {
  await requireUserForAction();

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Status inválido." };
  }
  const { id, status } = parsed.data;

  const atual = await prisma.quote.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!atual) return { ok: false, error: "Orçamento não encontrado." };

  if (
    atual.status !== status &&
    !TRANSICOES[atual.status].includes(status)
  ) {
    return { ok: false, error: "Transição de status não permitida." };
  }

  try {
    await prisma.quote.update({ where: { id }, data: { status } });
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status." };
  }

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// deleteOrcamento
// ---------------------------------------------------------------------------

export async function deleteOrcamento(id: string): Promise<ActionResult> {
  await requireUserForAction();
  if (!id) return { ok: false, error: "Orçamento inválido." };

  try {
    await prisma.quote.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir o orçamento." };
  }
  revalidatePath("/orcamentos");
  redirect("/orcamentos");
}

// ---------------------------------------------------------------------------
// explicarOrcamento — gera explicação do orçamento com IA
// ---------------------------------------------------------------------------

export async function explicarOrcamento(quoteId: string): Promise<string> {
  const user = await requireUserForAction();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: true,
      vehicle: { select: { marca: true, modelo: true } },
    },
  });
  if (!quote) throw new Error("Orçamento não encontrado.");

  return explainQuote({
    numero: quote.numero,
    veiculo: `${quote.vehicle.marca} ${quote.vehicle.modelo}`,
    itens: quote.items.map((i) => ({
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
    })),
    total: Number(quote.total),
    userId: user.id,
  });
}

// ---------------------------------------------------------------------------
// converterEmOS — cria ServiceOrder a partir de um orçamento APROVADO
// ---------------------------------------------------------------------------

export async function converterEmOS(quoteId: string): Promise<ActionResult> {
  await requireUserForAction();
  if (!quoteId) return { ok: false, error: "Orçamento inválido." };

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });
  if (!quote) return { ok: false, error: "Orçamento não encontrado." };
  if (quote.status !== "APROVADO") {
    return { ok: false, error: "Só é possível converter orçamentos aprovados." };
  }

  // Evita duplicar: se já houver uma OS vinculada a este orçamento, reaproveita.
  if (quote.serviceOrderId) {
    redirect(`/ordens-servico/${quote.serviceOrderId}`);
  }

  let osId: string;
  try {
    osId = await prisma.$transaction(async (tx) => {
      const numero = await gerarNumeroOS();

      const valorMaoObra = quote.items
        .filter((i) => i.tipo === "SERVICO")
        .reduce((acc, i) => acc + Number(i.subtotal), 0);
      const valorPecas = quote.items
        .filter((i) => i.tipo === "PECA")
        .reduce((acc, i) => acc + Number(i.subtotal), 0);

      const os = await tx.serviceOrder.create({
        data: {
          numero,
          customerId: quote.customerId,
          vehicleId: quote.vehicleId,
          status: "APROVADA",
          valorMaoObra,
          valorPecas,
          desconto: Number(quote.desconto),
          total: Number(quote.total),
          obsCliente: quote.observacoes,
          items: {
            create: quote.items.map((i) => ({
              tipo: i.tipo,
              serviceId: i.serviceId,
              partId: i.partId,
              descricao: i.descricao,
              quantidade: i.quantidade,
              precoUnitario: Number(i.precoUnitario),
              subtotal: Number(i.subtotal),
            })),
          },
        },
        select: { id: true },
      });

      // Vincula o orçamento à OS criada.
      await tx.quote.update({
        where: { id: quoteId },
        data: { serviceOrderId: os.id },
      });

      return os.id;
    });
  } catch {
    return { ok: false, error: "Não foi possível converter em OS." };
  }

  revalidatePath(`/orcamentos/${quoteId}`);
  revalidatePath("/ordens");
  redirect(`/ordens-servico/${osId}`);
}
