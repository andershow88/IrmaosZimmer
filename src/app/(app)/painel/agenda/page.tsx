import Link from "next/link";
import { CalendarDays, Plus, User, Car, Wrench, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Prisma, StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { AgendaFiltros } from "@/components/agenda/agenda-filtros";

export const dynamic = "force-dynamic";

const STATUS_VALIDOS = new Set<StatusAgendamento>([
  "AGENDADO",
  "CONFIRMADO",
  "VEICULO_RECEBIDO",
  "NAO_COMPARECEU",
  "CANCELADO",
  "CONCLUIDO",
]);

type SearchParams = Promise<{ status?: string; q?: string }>;

/** Rótulo de dia: "Hoje", "Amanhã" ou "ter., 03/06/2026". */
function diaLabel(d: Date): string {
  const hoje = new Date();
  const startToday = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((startDate.getTime() - startToday.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  return format(d, "EEEE, dd/MM/yyyy", { locale: ptBR });
}

function chaveDia(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const sp = await searchParams;
  const statusFiltro =
    sp.status && STATUS_VALIDOS.has(sp.status as StatusAgendamento)
      ? (sp.status as StatusAgendamento)
      : undefined;
  const busca = (sp.q ?? "").trim();

  const where: Prisma.AppointmentWhereInput = {};
  if (statusFiltro) where.status = statusFiltro;
  if (busca) {
    where.OR = [
      { servicoDesejado: { contains: busca, mode: "insensitive" } },
      { customer: { is: { nome: { contains: busca, mode: "insensitive" } } } },
      { vehicle: { is: { placa: { contains: busca, mode: "insensitive" } } } },
      { vehicle: { is: { modelo: { contains: busca, mode: "insensitive" } } } },
      { vehicle: { is: { marca: { contains: busca, mode: "insensitive" } } } },
    ];
  }

  const agendamentos = await prisma.appointment.findMany({
    where,
    orderBy: { dataHora: "asc" },
    include: {
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
      mecanico: { select: { name: true } },
    },
  });

  // Agrupa por dia (mantém ordem cronológica).
  const grupos = new Map<string, { label: string; itens: typeof agendamentos }>();
  for (const a of agendamentos) {
    const key = chaveDia(a.dataHora);
    if (!grupos.has(key)) grupos.set(key, { label: diaLabel(a.dataHora), itens: [] });
    grupos.get(key)!.itens.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Agendamentos da oficina organizados por dia."
        icon={CalendarDays}
        action={
          <Link href="/painel/agenda/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo agendamento
            </Button>
          </Link>
        }
      />

      <div className="mb-5">
        <AgendaFiltros status={sp.status ?? ""} busca={busca} />
      </div>

      {agendamentos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum agendamento encontrado"
          message={
            statusFiltro || busca
              ? "Ajuste os filtros para ver mais resultados."
              : "Crie o primeiro agendamento para começar a organizar a agenda."
          }
          action={
            <Link href="/painel/agenda/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Novo agendamento
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[...grupos.values()].map((grupo) => (
            <section key={grupo.label}>
              <h2 className="mb-2 text-sm font-bold capitalize text-foreground">
                {grupo.label}
                <span className="ml-2 text-xs font-normal text-muted">
                  ({grupo.itens.length}{" "}
                  {grupo.itens.length === 1 ? "agendamento" : "agendamentos"})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {grupo.itens.map((a) => {
                  const veiculo = a.vehicle
                    ? `${a.vehicle.marca} ${a.vehicle.modelo}${a.vehicle.placa ? ` · ${a.vehicle.placa}` : ""}`
                    : "Sem veículo";
                  return (
                    <Link key={a.id} href={`/painel/agenda/${a.id}`} className="block">
                      <Card className="h-full transition hover:border-border-strong/70 hover:shadow-md">
                        <CardBody className="flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                              <Clock className="h-4 w-4 text-accent" />
                              {format(a.dataHora, "HH:mm", { locale: ptBR })}
                              <span className="text-xs font-normal text-muted">
                                · {a.duracaoMin} min
                              </span>
                            </div>
                            <StatusBadge kind="agendamento" status={a.status} />
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <User className="h-3.5 w-3.5 shrink-0 text-muted" />
                            <span className="truncate font-medium">{a.customer.nome}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-muted">
                            <Car className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{veiculo}</span>
                          </div>

                          {a.servicoDesejado && (
                            <div className="flex items-center gap-1.5 text-sm text-muted">
                              <Wrench className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{a.servicoDesejado}</span>
                            </div>
                          )}

                          <div className="mt-0.5 text-xs text-subtle">
                            {a.mecanico?.name
                              ? `Mecânico: ${a.mecanico.name}`
                              : "Sem mecânico definido"}
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
