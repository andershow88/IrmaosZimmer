import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import type { Prisma, StatusOS, PrioridadeOS } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { OSFilters } from "@/components/ordens/os-filters";
import { PrioridadeBadge } from "@/components/ordens/prioridade-badge";

export const dynamic = "force-dynamic";

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
const PRIORIDADE_VALUES: PrioridadeOS[] = ["BAIXA", "NORMAL", "ALTA", "URGENTE"];

export default async function OrdensServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; prioridade?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const status = STATUS_VALUES.includes(sp.status as StatusOS)
    ? (sp.status as StatusOS)
    : "";
  const prioridade = PRIORIDADE_VALUES.includes(sp.prioridade as PrioridadeOS)
    ? (sp.prioridade as PrioridadeOS)
    : "";

  const where: Prisma.ServiceOrderWhereInput = {};
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (q) {
    where.OR = [
      { numero: { contains: q, mode: "insensitive" } },
      { customer: { nome: { contains: q, mode: "insensitive" } } },
      { vehicle: { placa: { contains: q, mode: "insensitive" } } },
    ];
  }

  const ordens = await prisma.serviceOrder.findMany({
    where,
    include: { customer: true, vehicle: true },
    orderBy: { dataAbertura: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        description="Gerencie as ordens de serviço da oficina."
        icon={ClipboardList}
        action={
          <Link href="/painel/ordens-servico/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Nova OS
            </Button>
          </Link>
        }
      />

      <OSFilters status={status} prioridade={prioridade} q={q} />

      {ordens.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma ordem de serviço encontrada"
          message={
            q || status || prioridade
              ? "Tente ajustar os filtros de busca."
              : "Crie a primeira ordem de serviço para começar."
          }
          action={
            <Link href="/painel/ordens-servico/novo">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nova OS
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Número</TH>
              <TH>Cliente</TH>
              <TH>Veículo</TH>
              <TH>Status</TH>
              <TH>Prioridade</TH>
              <TH className="text-right">Total</TH>
              <TH>Previsão</TH>
            </TR>
          </THead>
          <TBody>
            {ordens.map((os) => (
              <TR key={os.id} className="cursor-pointer">
                <TD className="font-semibold">
                  <Link
                    href={`/painel/ordens-servico/${os.id}`}
                    className="text-accent hover:underline"
                  >
                    {os.numero}
                  </Link>
                </TD>
                <TD>{os.customer.nome}</TD>
                <TD>
                  <span className="font-medium">
                    {os.vehicle.marca} {os.vehicle.modelo}
                  </span>
                  <span className="ml-1 text-muted">{os.vehicle.placa}</span>
                </TD>
                <TD>
                  <StatusBadge kind="os" status={os.status} />
                </TD>
                <TD>
                  <PrioridadeBadge prioridade={os.prioridade} />
                </TD>
                <TD className="text-right font-semibold tabular-nums">
                  {formatBRL(os.total)}
                </TD>
                <TD className="text-muted">
                  {os.previsaoEntrega ? formatDateTimeBR(os.previsaoEntrega) : "—"}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
