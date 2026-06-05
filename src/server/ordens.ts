"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { Prisma, StatusOS, PrioridadeOS } from "@prisma/client";

const ROUTE = "/painel/ordens-servico";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converte Prisma.Decimal | number | string em number seguro. */
function num(value: number | string | { toString(): string } | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Arredonda para 2 casas decimais (centavos). */
function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Gera o próximo número de OS no formato OS-AAAA-0001. */
async function gerarNumeroOS(): Promise<string> {
  const ano = new Date().getFullYear();
  const count = await prisma.serviceOrder.count();
  const seq = String(count + 1).padStart(4, "0");
  return `OS-${ano}-${seq}`;
}

/**
 * Recalcula valorPecas (soma dos itens PECA), total
 * (mãoObra + peças - desconto) e persiste na OS.
 */
export async function recalcularTotais(serviceOrderId: string): Promise<void> {
  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: { items: true },
  });
  if (!os) throw new Error("Ordem de serviço não encontrada.");

  const valorPecas = os.items
    .filter((i) => i.tipo === "PECA")
    .reduce((acc, i) => acc + num(i.subtotal), 0);

  const valorMaoObra = num(os.valorMaoObra);
  const desconto = num(os.desconto);
  const total = money(valorMaoObra + valorPecas - desconto);

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: {
      valorPecas: money(valorPecas),
      total: total < 0 ? 0 : total,
    },
  });
}

/**
 * Recalcula ServiceOrder.tempoPrevistoMin como a soma dos tempoEstimadoMin
 * dos itens de SERVIÇO (multiplicado pela quantidade). Persiste na OS.
 */
export async function recalcularTempoPrevisto(serviceOrderId: string): Promise<void> {
  const itens = await prisma.serviceOrderItem.findMany({
    where: { serviceOrderId, tipo: "SERVICO" },
    select: { tempoEstimadoMin: true, quantidade: true },
  });

  const tempoPrevistoMin = itens.reduce(
    (acc, i) => acc + (i.tempoEstimadoMin ?? 0) * (i.quantidade ?? 1),
    0
  );

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { tempoPrevistoMin },
  });
}

// ---------------------------------------------------------------------------
// createOS
// ---------------------------------------------------------------------------

const createOSSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente."),
  vehicleId: z.string().min(1, "Selecione um veículo."),
  quilometragem: z
    .union([z.coerce.number().int().min(0), z.literal(NaN)])
    .optional(),
  problemaRelatado: z.string().trim().optional(),
  prioridade: z.enum(["BAIXA", "NORMAL", "ALTA", "URGENTE"]).default("NORMAL"),
  mecanicoId: z.string().optional(),
});

export type CreateOSResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createOS(formData: FormData): Promise<CreateOSResult> {
  const actor = await requireUserForAction();

  const parsed = createOSSchema.safeParse({
    customerId: formData.get("customerId"),
    vehicleId: formData.get("vehicleId"),
    quilometragem: formData.get("quilometragem") || undefined,
    problemaRelatado: formData.get("problemaRelatado") || undefined,
    prioridade: formData.get("prioridade") || "NORMAL",
    mecanicoId: formData.get("mecanicoId") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  // Garante que o veículo pertence ao cliente.
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: data.vehicleId },
    select: { customerId: true },
  });
  if (!vehicle || vehicle.customerId !== data.customerId) {
    return { ok: false, error: "Veículo não pertence ao cliente selecionado." };
  }

  const numero = await gerarNumeroOS();
  const km =
    data.quilometragem != null && Number.isFinite(data.quilometragem)
      ? data.quilometragem
      : null;

  const os = await prisma.serviceOrder.create({
    data: {
      numero,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      quilometragem: km,
      problemaRelatado: data.problemaRelatado || null,
      prioridade: data.prioridade as PrioridadeOS,
      mecanicoId: data.mecanicoId || null,
      status: "ABERTA",
    },
  });

  await logAudit(
    actor.id,
    "CRIAR",
    "ServiceOrder",
    os.id,
    `Ordem de serviço ${os.numero} aberta.`
  );

  revalidatePath(ROUTE);
  return { ok: true, id: os.id };
}

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

const STATUS_VALUES: StatusOS[] = [
  "ABERTA",
  "AGUARDANDO_DIAGNOSTICO",
  "AGUARDANDO_APROVACAO",
  "APROVADA",
  "EM_EXECUCAO",
  "AGUARDANDO_PECAS",
  "CONCLUIDA",
  "ENTREGUE",
  "CANCELADA",
];

export async function updateStatus(
  serviceOrderId: string,
  status: StatusOS
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireUserForAction();

  if (!STATUS_VALUES.includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  const os = await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { status },
    select: { numero: true },
  });

  await logAudit(
    actor.id,
    "ATUALIZAR",
    "ServiceOrder",
    serviceOrderId,
    `Status da OS ${os.numero} alterado para ${status}.`
  );

  revalidatePath(ROUTE);
  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// updateCampos (diagnóstico, mão de obra, desconto, previsão, observações)
// ---------------------------------------------------------------------------

const updateCamposSchema = z.object({
  diagnostico: z.string().trim().optional(),
  problemaRelatado: z.string().trim().optional(),
  valorMaoObra: z.coerce.number().min(0).optional(),
  desconto: z.coerce.number().min(0).optional(),
  previsaoEntrega: z.string().trim().optional(),
  obsInternas: z.string().trim().optional(),
  obsCliente: z.string().trim().optional(),
});

export async function updateCampos(
  serviceOrderId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  await requireUserForAction();

  const parsed = updateCamposSchema.safeParse({
    diagnostico: formData.get("diagnostico") ?? undefined,
    problemaRelatado: formData.get("problemaRelatado") ?? undefined,
    valorMaoObra: formData.get("valorMaoObra") ?? undefined,
    desconto: formData.get("desconto") ?? undefined,
    previsaoEntrega: formData.get("previsaoEntrega") ?? undefined,
    obsInternas: formData.get("obsInternas") ?? undefined,
    obsCliente: formData.get("obsCliente") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  const update: Prisma.ServiceOrderUpdateInput = {};

  if (formData.has("diagnostico")) update.diagnostico = d.diagnostico || null;
  if (formData.has("problemaRelatado"))
    update.problemaRelatado = d.problemaRelatado || null;
  if (formData.has("valorMaoObra") && d.valorMaoObra != null)
    update.valorMaoObra = money(d.valorMaoObra);
  if (formData.has("desconto") && d.desconto != null)
    update.desconto = money(d.desconto);
  if (formData.has("previsaoEntrega"))
    update.previsaoEntrega = d.previsaoEntrega ? new Date(d.previsaoEntrega) : null;
  if (formData.has("obsInternas")) update.obsInternas = d.obsInternas || null;
  if (formData.has("obsCliente")) update.obsCliente = d.obsCliente || null;

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: update,
  });

  // Recalcula caso mão de obra ou desconto tenham mudado.
  if (formData.has("valorMaoObra") || formData.has("desconto")) {
    await recalcularTotais(serviceOrderId);
  }

  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// atribuirMecanico
// ---------------------------------------------------------------------------

export async function atribuirMecanico(
  serviceOrderId: string,
  mecanicoId: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireUserForAction();

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { mecanicoId: mecanicoId || null },
  });

  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// addServicoItem (serviço do catálogo)
// ---------------------------------------------------------------------------

const addServicoSchema = z.object({
  serviceId: z.string().min(1, "Selecione um serviço."),
  quantidade: z.coerce.number().int().min(1, "Quantidade inválida.").default(1),
});

export async function addServicoItem(
  serviceOrderId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  await requireUserForAction();

  const parsed = addServicoSchema.safeParse({
    serviceId: formData.get("serviceId"),
    quantidade: formData.get("quantidade") || 1,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { serviceId, quantidade } = parsed.data;
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return { ok: false, error: "Serviço não encontrado." };

  const precoUnitario = money(num(service.precoPadrao));
  const subtotal = money(precoUnitario * quantidade);

  await prisma.serviceOrderItem.create({
    data: {
      serviceOrderId,
      tipo: "SERVICO",
      serviceId: service.id,
      descricao: service.nome,
      quantidade,
      precoUnitario,
      subtotal,
      // Snapshot do tempo estimado do serviço no momento da adição.
      tempoEstimadoMin: service.tempoEstimadoMin ?? null,
    },
  });

  await recalcularTotais(serviceOrderId);
  await recalcularTempoPrevisto(serviceOrderId);
  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// addPecaItem (peça do estoque -> gera movimentação SAIDA e decrementa estoque)
// ---------------------------------------------------------------------------

const addPecaSchema = z.object({
  partId: z.string().min(1, "Selecione uma peça."),
  quantidade: z.coerce.number().int().min(1, "Quantidade inválida.").default(1),
});

export async function addPecaItem(
  serviceOrderId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserForAction();

  const parsed = addPecaSchema.safeParse({
    partId: formData.get("partId"),
    quantidade: formData.get("quantidade") || 1,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { partId, quantidade } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({ where: { id: partId } });
      if (!part) throw new Error("Peça não encontrada.");
      if (part.quantidade < quantidade) {
        throw new Error(
          `Estoque insuficiente. Disponível: ${part.quantidade} un.`
        );
      }

      const precoUnitario = money(num(part.precoVenda));
      const subtotal = money(precoUnitario * quantidade);

      await tx.serviceOrderItem.create({
        data: {
          serviceOrderId,
          tipo: "PECA",
          partId: part.id,
          descricao: part.nome,
          quantidade,
          precoUnitario,
          subtotal,
        },
      });

      await tx.part.update({
        where: { id: part.id },
        data: { quantidade: { decrement: quantidade } },
      });

      await tx.inventoryMovement.create({
        data: {
          partId: part.id,
          tipo: "SAIDA",
          quantidade,
          motivo: "Consumo em ordem de serviço",
          serviceOrderId,
          createdById: user.id,
        },
      });
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao adicionar peça.",
    };
  }

  await recalcularTotais(serviceOrderId);
  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// removeItem (devolve estoque caso seja peça)
// ---------------------------------------------------------------------------

export async function removeItem(
  itemId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserForAction();

  const item = await prisma.serviceOrderItem.findUnique({
    where: { id: itemId },
  });
  if (!item) return { ok: false, error: "Item não encontrado." };

  const serviceOrderId = item.serviceOrderId;

  try {
    await prisma.$transaction(async (tx) => {
      // Devolve o estoque se for peça.
      if (item.tipo === "PECA" && item.partId) {
        await tx.part.update({
          where: { id: item.partId },
          data: { quantidade: { increment: item.quantidade } },
        });
        await tx.inventoryMovement.create({
          data: {
            partId: item.partId,
            tipo: "ENTRADA",
            quantidade: item.quantidade,
            motivo: "Estorno de item removido da OS",
            serviceOrderId,
            createdById: user.id,
          },
        });
      }
      await tx.serviceOrderItem.delete({ where: { id: itemId } });
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao remover item.",
    };
  }

  await recalcularTotais(serviceOrderId);
  // Tempo previsto muda apenas quando o item removido é de serviço.
  if (item.tipo === "SERVICO") {
    await recalcularTempoPrevisto(serviceOrderId);
  }
  revalidatePath(`${ROUTE}/${serviceOrderId}`);
  revalidatePath(ROUTE);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ações de IA (resumos) — retornam texto para exibir ao usuário.
// ---------------------------------------------------------------------------

export async function resumirOSComIA(
  serviceOrderId: string
): Promise<{ ok: boolean; texto?: string; error?: string }> {
  const user = await requireUserForAction();
  const { summarizeServiceOrder } = await import("@/lib/ai");

  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: { vehicle: true, items: true },
  });
  if (!os) return { ok: false, error: "Ordem de serviço não encontrada." };

  const veiculo = os.vehicle
    ? `${os.vehicle.marca} ${os.vehicle.modelo} (${os.vehicle.placa})`
    : undefined;

  const texto = await summarizeServiceOrder({
    numero: os.numero,
    veiculo,
    problemaRelatado: os.problemaRelatado ?? undefined,
    diagnostico: os.diagnostico ?? undefined,
    status: os.status,
    itens: os.items.map((i) => ({ descricao: i.descricao, quantidade: i.quantidade })),
    total: num(os.total),
    userId: user.id,
  });

  return { ok: true, texto };
}

// ---------------------------------------------------------------------------
// readdItem — "Desfazer" a remoção de um item (re-adiciona reutilizando a
// MESMA lógica de addServicoItem/addPecaItem). NÃO altera cálculos/estoque
// existentes: apenas chama as ações públicas já validadas.
// ---------------------------------------------------------------------------

export type RemovedItemSnapshot = {
  serviceOrderId: string;
  tipo: "SERVICO" | "PECA";
  /** Id do serviço de catálogo (quando tipo = SERVICO). */
  serviceId?: string | null;
  /** Id da peça de estoque (quando tipo = PECA). */
  partId?: string | null;
  quantidade: number;
};

/**
 * Re-adiciona um item previamente removido, reaproveitando as ações de adição
 * já existentes (com toda a validação de estoque, recálculo de totais e de
 * tempo previsto). Retorna erro amigável caso o item não tenha mais vínculo
 * de catálogo/estoque (ex.: serviço/peça excluído).
 */
export async function readdItem(
  snapshot: RemovedItemSnapshot
): Promise<{ ok: boolean; error?: string }> {
  if (snapshot.tipo === "SERVICO") {
    if (!snapshot.serviceId) {
      return { ok: false, error: "Não é possível desfazer: serviço sem referência de catálogo." };
    }
    const fd = new FormData();
    fd.set("serviceId", snapshot.serviceId);
    fd.set("quantidade", String(snapshot.quantidade));
    return addServicoItem(snapshot.serviceOrderId, fd);
  }

  if (!snapshot.partId) {
    return { ok: false, error: "Não é possível desfazer: peça sem referência de estoque." };
  }
  const fd = new FormData();
  fd.set("partId", snapshot.partId);
  fd.set("quantidade", String(snapshot.quantidade));
  return addPecaItem(snapshot.serviceOrderId, fd);
}

// ---------------------------------------------------------------------------
// getOSTimeline — leitura cronológica de atividades da OS.
// Combina o AuditLog (com usuário responsável) e eventos derivados das
// entidades relacionadas (criação, itens, horas, pagamentos). Somente LEITURA.
// ---------------------------------------------------------------------------

export type TimelineEventKind =
  | "criacao"
  | "status"
  | "item_add"
  | "item_remove"
  | "pagamento"
  | "horas"
  | "auditoria";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  titulo: string;
  detalhe?: string | null;
  usuario?: string | null;
  data: Date;
};

export async function getOSTimeline(
  serviceOrderId: string
): Promise<TimelineEvent[]> {
  await requireUserForAction();

  const os = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    select: { id: true, numero: true, dataAbertura: true },
  });
  if (!os) return [];

  const eventos: TimelineEvent[] = [];

  // Evento de criação (derivado).
  eventos.push({
    id: `criacao-${os.id}`,
    kind: "criacao",
    titulo: `OS ${os.numero} aberta`,
    data: os.dataAbertura,
  });

  // Trilha de auditoria (status, edições) — inclui usuário responsável.
  const logs = await prisma.auditLog.findMany({
    where: { entidade: "ServiceOrder", entidadeId: serviceOrderId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });
  for (const l of logs) {
    // A criação já é representada pelo evento derivado acima.
    if (l.acao === "CRIAR") continue;
    eventos.push({
      id: `audit-${l.id}`,
      kind: l.detalhe?.toLowerCase().includes("status") ? "status" : "auditoria",
      titulo: l.detalhe ?? `${l.acao} em ${l.entidade}`,
      usuario: l.user?.name ?? null,
      data: l.createdAt,
    });
  }

  // Apontamentos de horas (início/fim) — derivado.
  const horas = await prisma.timeEntry.findMany({
    where: { serviceOrderId },
    orderBy: { inicio: "asc" },
    include: { user: { select: { name: true } } },
  });
  for (const t of horas) {
    eventos.push({
      id: `hora-inicio-${t.id}`,
      kind: "horas",
      titulo: "Cronômetro iniciado",
      usuario: t.user?.name ?? null,
      data: t.inicio,
    });
    if (t.fim) {
      eventos.push({
        id: `hora-fim-${t.id}`,
        kind: "horas",
        titulo: "Cronômetro parado",
        detalhe: t.minutos != null ? `${t.minutos} min registrados` : null,
        usuario: t.user?.name ?? null,
        data: t.fim,
      });
    }
  }

  // Pagamentos — derivado.
  const pagamentos = await prisma.payment.findMany({
    where: { serviceOrderId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      valorPago: true,
      forma: true,
      status: true,
      createdAt: true,
      dataPagamento: true,
    },
  });
  for (const p of pagamentos) {
    eventos.push({
      id: `pag-${p.id}`,
      kind: "pagamento",
      titulo: `Pagamento registrado (${p.status})`,
      detalhe: `${formatPagamentoForma(p.forma)} · ${moneyLabel(num(p.valorPago))}`,
      data: p.dataPagamento ?? p.createdAt,
    });
  }

  // Ordena do mais recente para o mais antigo.
  eventos.sort((a, b) => b.data.getTime() - a.data.getTime());
  return eventos;
}

function moneyLabel(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPagamentoForma(forma: string): string {
  const map: Record<string, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    CARTAO_DEBITO: "Cartão de débito",
    CARTAO_CREDITO: "Cartão de crédito",
    BOLETO: "Boleto",
    TRANSFERENCIA: "Transferência",
  };
  return map[forma] ?? forma;
}
