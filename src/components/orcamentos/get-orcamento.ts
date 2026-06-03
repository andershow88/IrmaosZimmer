import { prisma } from "@/lib/db";
import type { OrcamentoView } from "./types";

/** Carrega um orçamento e o serializa (Decimals -> number, datas -> ISO). */
export async function getOrcamento(id: string): Promise<OrcamentoView | null> {
  const q = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, nome: true, whatsapp: true, telefone: true },
      },
      vehicle: {
        select: { id: true, placa: true, marca: true, modelo: true },
      },
      items: { orderBy: { id: "asc" } },
    },
  });
  if (!q) return null;

  return {
    id: q.id,
    numero: q.numero,
    status: q.status,
    serviceOrderId: q.serviceOrderId,
    validade: q.validade ? q.validade.toISOString() : null,
    desconto: Number(q.desconto),
    total: Number(q.total),
    observacoes: q.observacoes,
    createdAt: q.createdAt.toISOString(),
    cliente: {
      id: q.customer.id,
      nome: q.customer.nome,
      whatsapp: q.customer.whatsapp,
      telefone: q.customer.telefone,
    },
    veiculo: {
      id: q.vehicle.id,
      placa: q.vehicle.placa,
      marca: q.vehicle.marca,
      modelo: q.vehicle.modelo,
    },
    items: q.items.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      serviceId: i.serviceId,
      partId: i.partId,
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
      subtotal: Number(i.subtotal),
    })),
  };
}
