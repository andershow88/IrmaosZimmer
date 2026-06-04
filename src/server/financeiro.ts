"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireModuleForAction } from "@/lib/permissions-server";
import { logAudit } from "@/lib/audit";
import { calcularSaldoSessao } from "@/lib/financeiro-calc";

// ---------------------------------------------------------------------------
// Tipo de retorno padrão das actions
// ---------------------------------------------------------------------------

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function primeiroErro(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

const REVALIDATE_PATHS = [
  "/painel/financeiro",
  "/painel/financeiro/contas-a-pagar",
  "/painel/financeiro/contas-a-receber",
  "/painel/financeiro/fluxo-de-caixa",
  "/painel/financeiro/caixa",
];

function revalidarFinanceiro(): void {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

// ===========================================================================
// CONTAS A PAGAR
// ===========================================================================

const contaPagarSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição."),
  supplierId: z.string().optional(),
  valor: z.coerce
    .number({ invalid_type_error: "Informe o valor." })
    .positive("O valor deve ser maior que zero."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
});

/** Cria uma nova conta a pagar. */
export async function criarContaPagar(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = contaPagarSchema.safeParse({
    descricao: formData.get("descricao"),
    supplierId: formData.get("supplierId") || undefined,
    valor: formData.get("valor"),
    vencimento: formData.get("vencimento"),
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const data = parsed.data;

  const created = await prisma.accountPayable.create({
    data: {
      descricao: data.descricao,
      supplierId: data.supplierId || null,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
    },
  });

  await logAudit(user.id, "CRIAR", "AccountPayable", created.id, data.descricao);
  revalidarFinanceiro();
  return { ok: true, id: created.id };
}

const contaPagarUpdateSchema = contaPagarSchema.extend({
  id: z.string().min(1),
});

/** Atualiza uma conta a pagar. */
export async function atualizarContaPagar(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = contaPagarUpdateSchema.safeParse({
    id: formData.get("id"),
    descricao: formData.get("descricao"),
    supplierId: formData.get("supplierId") || undefined,
    valor: formData.get("valor"),
    vencimento: formData.get("vencimento"),
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const data = parsed.data;

  const existing = await prisma.accountPayable.findUnique({ where: { id: data.id } });
  if (!existing) return { ok: false, error: "Conta a pagar não encontrada." };

  await prisma.accountPayable.update({
    where: { id: data.id },
    data: {
      descricao: data.descricao,
      supplierId: data.supplierId || null,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
    },
  });

  await logAudit(user.id, "ATUALIZAR", "AccountPayable", data.id, data.descricao);
  revalidarFinanceiro();
  return { ok: true, id: data.id };
}

/** Alterna o status de pago/não pago de uma conta a pagar. */
export async function alternarPagamentoConta(id: string): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const existing = await prisma.accountPayable.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Conta a pagar não encontrada." };

  const pago = !existing.pago;
  await prisma.accountPayable.update({
    where: { id },
    data: { pago, dataPagamento: pago ? new Date() : null },
  });

  await logAudit(
    user.id,
    pago ? "MARCAR_PAGO" : "MARCAR_NAO_PAGO",
    "AccountPayable",
    id
  );
  revalidarFinanceiro();
  return { ok: true, id };
}

/** Exclui uma conta a pagar. */
export async function excluirContaPagar(id: string): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const existing = await prisma.accountPayable.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Conta a pagar não encontrada." };

  await prisma.accountPayable.delete({ where: { id } });

  await logAudit(user.id, "EXCLUIR", "AccountPayable", id, existing.descricao);
  revalidarFinanceiro();
  return { ok: true, id };
}

// ===========================================================================
// CONTAS A RECEBER
// ===========================================================================

const contaReceberSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição."),
  customerId: z.string().optional(),
  serviceOrderId: z.string().optional(),
  valor: z.coerce
    .number({ invalid_type_error: "Informe o valor." })
    .positive("O valor deve ser maior que zero."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
});

/** Cria uma nova conta a receber. */
export async function criarContaReceber(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = contaReceberSchema.safeParse({
    descricao: formData.get("descricao"),
    customerId: formData.get("customerId") || undefined,
    serviceOrderId: formData.get("serviceOrderId") || undefined,
    valor: formData.get("valor"),
    vencimento: formData.get("vencimento"),
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const data = parsed.data;

  const created = await prisma.accountReceivable.create({
    data: {
      descricao: data.descricao,
      customerId: data.customerId || null,
      serviceOrderId: data.serviceOrderId || null,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
    },
  });

  await logAudit(user.id, "CRIAR", "AccountReceivable", created.id, data.descricao);
  revalidarFinanceiro();
  return { ok: true, id: created.id };
}

const contaReceberUpdateSchema = contaReceberSchema.extend({
  id: z.string().min(1),
});

/** Atualiza uma conta a receber. */
export async function atualizarContaReceber(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = contaReceberUpdateSchema.safeParse({
    id: formData.get("id"),
    descricao: formData.get("descricao"),
    customerId: formData.get("customerId") || undefined,
    serviceOrderId: formData.get("serviceOrderId") || undefined,
    valor: formData.get("valor"),
    vencimento: formData.get("vencimento"),
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const data = parsed.data;

  const existing = await prisma.accountReceivable.findUnique({ where: { id: data.id } });
  if (!existing) return { ok: false, error: "Conta a receber não encontrada." };

  await prisma.accountReceivable.update({
    where: { id: data.id },
    data: {
      descricao: data.descricao,
      customerId: data.customerId || null,
      serviceOrderId: data.serviceOrderId || null,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
    },
  });

  await logAudit(user.id, "ATUALIZAR", "AccountReceivable", data.id, data.descricao);
  revalidarFinanceiro();
  return { ok: true, id: data.id };
}

/** Alterna o status de recebido/não recebido de uma conta a receber. */
export async function alternarRecebimentoConta(id: string): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const existing = await prisma.accountReceivable.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Conta a receber não encontrada." };

  const recebido = !existing.recebido;
  await prisma.accountReceivable.update({
    where: { id },
    data: { recebido, dataRecebimento: recebido ? new Date() : null },
  });

  await logAudit(
    user.id,
    recebido ? "MARCAR_RECEBIDO" : "MARCAR_NAO_RECEBIDO",
    "AccountReceivable",
    id
  );
  revalidarFinanceiro();
  return { ok: true, id };
}

/** Exclui uma conta a receber. */
export async function excluirContaReceber(id: string): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const existing = await prisma.accountReceivable.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Conta a receber não encontrada." };

  await prisma.accountReceivable.delete({ where: { id } });

  await logAudit(user.id, "EXCLUIR", "AccountReceivable", id, existing.descricao);
  revalidarFinanceiro();
  return { ok: true, id };
}

// ===========================================================================
// FECHAMENTO DE CAIXA (CashSession + CashMovement)
// ===========================================================================

const abrirCaixaSchema = z.object({
  valorAbertura: z.coerce
    .number({ invalid_type_error: "Informe o valor de abertura." })
    .nonnegative("O valor de abertura não pode ser negativo."),
});

/** Abre uma nova sessão de caixa. Falha se já houver caixa aberto. */
export async function abrirCaixa(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = abrirCaixaSchema.safeParse({
    valorAbertura: formData.get("valorAbertura"),
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const aberto = await prisma.cashSession.findFirst({ where: { status: "ABERTO" } });
  if (aberto) return { ok: false, error: "Já existe um caixa aberto. Feche-o antes de abrir outro." };

  const created = await prisma.cashSession.create({
    data: {
      valorAbertura: parsed.data.valorAbertura,
      userId: user.id,
      status: "ABERTO",
    },
  });

  await logAudit(user.id, "ABRIR_CAIXA", "CashSession", created.id);
  revalidarFinanceiro();
  return { ok: true, id: created.id };
}

const movimentoCaixaSchema = z.object({
  cashSessionId: z.string().min(1, "Sessão de caixa inválida."),
  tipo: z.enum(["ENTRADA", "SAIDA"], {
    errorMap: () => ({ message: "Selecione o tipo do movimento." }),
  }),
  valor: z.coerce
    .number({ invalid_type_error: "Informe o valor." })
    .positive("O valor deve ser maior que zero."),
  descricao: z.string().optional(),
  formaPagamento: z.string().optional(),
});

/** Registra um movimento (entrada/saída) na sessão de caixa aberta. */
export async function registrarMovimentoCaixa(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const parsed = movimentoCaixaSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    descricao: formData.get("descricao") || undefined,
    formaPagamento: formData.get("formaPagamento") || undefined,
  });
  if (!parsed.success) return { ok: false, error: primeiroErro(parsed.error) };

  const data = parsed.data;

  const sessao = await prisma.cashSession.findUnique({ where: { id: data.cashSessionId } });
  if (!sessao) return { ok: false, error: "Sessão de caixa não encontrada." };
  if (sessao.status !== "ABERTO") {
    return { ok: false, error: "O caixa está fechado. Não é possível lançar movimentos." };
  }

  const created = await prisma.cashMovement.create({
    data: {
      cashSessionId: data.cashSessionId,
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao || null,
      formaPagamento: data.formaPagamento || null,
    },
  });

  await logAudit(user.id, "MOVIMENTO_CAIXA", "CashMovement", created.id, data.tipo);
  revalidarFinanceiro();
  return { ok: true, id: created.id };
}

/** Exclui um movimento de caixa (apenas se a sessão ainda estiver aberta). */
export async function excluirMovimentoCaixa(id: string): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const mov = await prisma.cashMovement.findUnique({
    where: { id },
    include: { cashSession: true },
  });
  if (!mov) return { ok: false, error: "Movimento não encontrado." };
  if (mov.cashSession.status !== "ABERTO") {
    return { ok: false, error: "O caixa está fechado. Não é possível excluir movimentos." };
  }

  await prisma.cashMovement.delete({ where: { id } });

  await logAudit(user.id, "EXCLUIR", "CashMovement", id);
  revalidarFinanceiro();
  return { ok: true, id };
}

/** Fecha a sessão de caixa aberta, gravando o valor de fechamento. */
export async function fecharCaixa(formData: FormData): Promise<ActionResult> {
  const user = await requireModuleForAction("financeiro");

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Sessão de caixa inválida." };

  const sessao = await prisma.cashSession.findUnique({
    where: { id },
    include: { movements: true },
  });
  if (!sessao) return { ok: false, error: "Sessão de caixa não encontrada." };
  if (sessao.status !== "ABERTO") return { ok: false, error: "Este caixa já está fechado." };

  const saldoCalculado = calcularSaldoSessao(
    Number(sessao.valorAbertura),
    sessao.movements
  );

  await prisma.cashSession.update({
    where: { id },
    data: {
      status: "FECHADO",
      fechamento: new Date(),
      valorFechamento: saldoCalculado,
    },
  });

  await logAudit(user.id, "FECHAR_CAIXA", "CashSession", id);
  revalidarFinanceiro();
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Fluxo de caixa (visão consolidada)
// ---------------------------------------------------------------------------

export type FluxoCaixaMensal = {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

const MESES_ABREV = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function startOfMonthOffset(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
}

function rotuloMesAno(d: Date): string {
  return `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

/**
 * Fluxo de caixa mensal: entradas = pagamentos PAGO + contas a receber recebidas;
 * saídas = contas a pagar pagas. Considera os últimos `meses` meses.
 */
export async function getFluxoCaixa(meses = 6): Promise<{
  series: FluxoCaixaMensal[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}> {
  const inicio = startOfMonthOffset(-(meses - 1));

  const [pagamentos, recebiveis, pagaveis] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PAGO", dataPagamento: { gte: inicio } },
      select: { valorPago: true, dataPagamento: true },
    }),
    prisma.accountReceivable.findMany({
      where: { recebido: true, dataRecebimento: { gte: inicio } },
      select: { valor: true, dataRecebimento: true },
    }),
    prisma.accountPayable.findMany({
      where: { pago: true, dataPagamento: { gte: inicio } },
      select: { valor: true, dataPagamento: true },
    }),
  ]);

  const buckets = new Map<
    string,
    { periodo: string; entradas: number; saidas: number; ordem: number }
  >();
  for (let i = 0; i < meses; i++) {
    const d = startOfMonthOffset(-(meses - 1) + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
      periodo: rotuloMesAno(d),
      entradas: 0,
      saidas: 0,
      ordem: i,
    });
  }

  function add(date: Date | null, valor: number, campo: "entradas" | "saidas") {
    if (!date) return;
    const d = new Date(date);
    const bucket = buckets.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket[campo] += valor;
  }

  for (const p of pagamentos) add(p.dataPagamento, Number(p.valorPago), "entradas");
  for (const r of recebiveis) add(r.dataRecebimento, Number(r.valor), "entradas");
  for (const c of pagaveis) add(c.dataPagamento, Number(c.valor), "saidas");

  const series = [...buckets.values()]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ periodo, entradas, saidas }) => ({
      periodo,
      entradas,
      saidas,
      saldo: entradas - saidas,
    }));

  const totalEntradas = series.reduce((acc, s) => acc + s.entradas, 0);
  const totalSaidas = series.reduce((acc, s) => acc + s.saidas, 0);

  return { series, totalEntradas, totalSaidas, saldo: totalEntradas - totalSaidas };
}
