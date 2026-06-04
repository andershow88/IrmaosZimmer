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
import { CalendarToggle } from "@/components/agenda/calendar-toggle";
import {
  CalendarWeek,
  type DiaCalendario,
} from "@/components/agenda/calendar-week";
import { getConfigAgenda } from "@/server/agenda-disponibilidade";
import { horaParaMinutos } from "@/lib/agenda-slots";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

const STATUS_VALIDOS = new Set<StatusAgendamento>([
  "AGENDADO",
  "CONFIRMADO",
  "VEICULO_RECEBIDO",
  "NAO_COMPARECEU",
  "CANCELADO",
  "CONCLUIDO",
]);

type SearchParams = Promise<{
  status?: string;
  q?: string;
  mecanico?: string;
  modo?: string;
  view?: string;
  ref?: string;
}>;

// ---------------------------------------------------------------------------
// Helpers de fuso horário (America/Sao_Paulo)
// ---------------------------------------------------------------------------

type PartesSP = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  diaSemana: number; // 0=Dom..6=Sáb
};

function partesEmSP(d: Date): PartesSP {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const semanaMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  let hora = Number(get("hour"));
  if (hora === 24) hora = 0;
  return {
    ano: Number(get("year")),
    mes: Number(get("month")),
    dia: Number(get("day")),
    hora,
    minuto: Number(get("minute")),
    diaSemana: semanaMap[get("weekday")] ?? 0,
  };
}

/** Constrói um Date (UTC) correspondente a um wall clock em SP. */
function dateEmSP(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number
): Date {
  const aprox = Date.UTC(ano, mes - 1, dia, hora, minuto, 0, 0);
  const p = partesEmSP(new Date(aprox));
  const marcadoUTC = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, 0, 0);
  const offset = aprox - marcadoUTC;
  return new Date(aprox + offset);
}

type DiaSP = { ano: number; mes: number; dia: number };

function chave(d: DiaSP): string {
  return `${d.ano}-${String(d.mes).padStart(2, "0")}-${String(d.dia).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" -> DiaSP. Retorna null se inválido. */
function parseRef(ref: string | undefined): DiaSP | null {
  if (!ref) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ref.trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { ano, mes, dia };
}

/** Soma `n` dias (calendário) a um DiaSP. */
function addDiasSP(d: DiaSP, n: number): DiaSP {
  const base = new Date(Date.UTC(d.ano, d.mes - 1, d.dia));
  base.setUTCDate(base.getUTCDate() + n);
  return {
    ano: base.getUTCFullYear(),
    mes: base.getUTCMonth() + 1,
    dia: base.getUTCDate(),
  };
}

/** Dia da semana (0=Dom..6=Sáb) de um DiaSP. */
function diaSemanaSP(d: DiaSP): number {
  return new Date(Date.UTC(d.ano, d.mes - 1, d.dia)).getUTCDay();
}

/** Segunda-feira da semana que contém `d` (semana Seg–Dom). */
function inicioSemanaSP(d: DiaSP): DiaSP {
  const dow = diaSemanaSP(d); // 0=Dom..6=Sáb
  const recuo = dow === 0 ? 6 : dow - 1; // dias até a segunda anterior
  return addDiasSP(d, -recuo);
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

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
  const mecanicoFiltro = (sp.mecanico ?? "").trim() || undefined;
  const modo = sp.modo === "lista" ? "lista" : "calendario";
  const view = sp.view === "dia" ? "dia" : "semana";

  const hojeSP = partesEmSP(new Date());
  const hoje: DiaSP = { ano: hojeSP.ano, mes: hojeSP.mes, dia: hojeSP.dia };
  const refDia = parseRef(sp.ref) ?? hoje;

  const mecanicos = await prisma.user.findMany({
    where: { ativo: true, role: { in: ["MECANICO", "ADMINISTRADOR"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // -------------------------------------------------------------------------
  // Modo LISTA — comportamento original (agrupado por dia, com busca textual).
  // -------------------------------------------------------------------------
  if (modo === "lista") {
    return (
      <ListaView
        statusFiltro={statusFiltro}
        mecanicoFiltro={mecanicoFiltro}
        busca={(sp.q ?? "").trim()}
        statusParam={sp.status ?? ""}
        mecanicoParam={sp.mecanico ?? ""}
        mecanicos={mecanicos}
        refDia={refDia}
        hoje={hoje}
        view={view}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Modo CALENDÁRIO — visão semana/dia.
  // -------------------------------------------------------------------------
  const { config, expediente } = await getConfigAgenda();

  // Dias visíveis (todos do período) e filtro de "abertos" no expediente.
  const periodoDias: DiaSP[] =
    view === "dia"
      ? [refDia]
      : Array.from({ length: 7 }, (_, i) =>
          addDiasSP(inicioSemanaSP(refDia), i)
        );

  const expedientePorDow = new Map(expediente.map((e) => [e.diaSemana, e]));
  const diasAbertos = periodoDias.filter((d) => {
    const e = expedientePorDow.get(diaSemanaSP(d));
    return !!e && e.aberto;
  });

  // Grade de horários: menor abertura e maior fechamento entre os dias abertos.
  let gridStartMin = 8 * 60;
  let gridEndMin = 18 * 60;
  if (diasAbertos.length > 0) {
    const abreList: number[] = [];
    const fechaList: number[] = [];
    for (const d of diasAbertos) {
      const e = expedientePorDow.get(diaSemanaSP(d))!;
      const a = horaParaMinutos(e.abre);
      const f = horaParaMinutos(e.fecha);
      if (!Number.isNaN(a)) abreList.push(a);
      if (!Number.isNaN(f)) fechaList.push(f);
    }
    if (abreList.length) gridStartMin = Math.min(...abreList);
    if (fechaList.length) gridEndMin = Math.max(...fechaList);
  }
  if (gridEndMin <= gridStartMin) {
    gridStartMin = 8 * 60;
    gridEndMin = 18 * 60;
  }

  // Intervalo de consulta: do início do 1º dia visível ao fim do último.
  const primeiro = periodoDias[0];
  const ultimo = periodoDias[periodoDias.length - 1];
  const inicioQuery = dateEmSP(primeiro.ano, primeiro.mes, primeiro.dia, 0, 0);
  const fimQuery = dateEmSP(
    addDiasSP(ultimo, 1).ano,
    addDiasSP(ultimo, 1).mes,
    addDiasSP(ultimo, 1).dia,
    0,
    0
  );

  const whereCal: Prisma.AppointmentWhereInput = {
    dataHora: { gte: inicioQuery, lt: fimQuery },
  };
  if (mecanicoFiltro) whereCal.mecanicoId = mecanicoFiltro;
  if (statusFiltro) whereCal.status = statusFiltro;

  const agendamentos = await prisma.appointment.findMany({
    where: whereCal,
    orderBy: { dataHora: "asc" },
    select: {
      id: true,
      dataHora: true,
      duracaoMin: true,
      status: true,
      servicoDesejado: true,
      customer: { select: { nome: true } },
      vehicle: { select: { marca: true, modelo: true, placa: true } },
      mecanico: { select: { name: true } },
      box: { select: { nome: true } },
    },
  });

  // Mapeia agendamentos por dia (chave YYYY-MM-DD em SP).
  const dias: DiaCalendario[] = diasAbertos.map((d) => {
    const k = chave(d);
    const dataDate = new Date(Date.UTC(d.ano, d.mes - 1, d.dia, 12, 0));
    return {
      data: k,
      diaSemanaLabel: format(dataDate, "EEE", { locale: ptBR }).replace(".", ""),
      diaMesLabel: format(dataDate, "dd/MM", { locale: ptBR }),
      hoje: k === chave(hoje),
      blocos: [],
    };
  });
  const diaPorChave = new Map(dias.map((d) => [d.data, d]));

  for (const a of agendamentos) {
    const p = partesEmSP(a.dataHora);
    const k = chave({ ano: p.ano, mes: p.mes, dia: p.dia });
    const dia = diaPorChave.get(k);
    if (!dia) continue; // dia fechado/fora da grade
    const inicioMin = p.hora * 60 + p.minuto;
    const veiculo = a.vehicle
      ? `${a.vehicle.marca} ${a.vehicle.modelo}${a.vehicle.placa ? ` · ${a.vehicle.placa}` : ""}`
      : null;
    dia.blocos.push({
      id: a.id,
      inicioMin,
      duracaoMin: a.duracaoMin,
      horaLabel: `${String(p.hora).padStart(2, "0")}:${String(p.minuto).padStart(2, "0")}`,
      status: a.status,
      cliente: a.customer.nome,
      veiculo,
      servico: a.servicoDesejado,
      mecanico: a.mecanico?.name ?? null,
      box: a.box?.nome ?? null,
    });
  }

  const totalBlocos = dias.reduce((acc, d) => acc + d.blocos.length, 0);

  // Rótulo e navegação do período.
  const refStr = chave(refDia);
  const hojeStr = chave(hoje);
  let periodoLabel: string;
  let refAnterior: string;
  let refProximo: string;
  if (view === "dia") {
    const dataDate = new Date(
      Date.UTC(refDia.ano, refDia.mes - 1, refDia.dia, 12, 0)
    );
    periodoLabel = format(dataDate, "EEE, dd 'de' MMM 'de' yyyy", {
      locale: ptBR,
    });
    refAnterior = chave(addDiasSP(refDia, -1));
    refProximo = chave(addDiasSP(refDia, 1));
  } else {
    const ini = inicioSemanaSP(refDia);
    const fim = addDiasSP(ini, 6);
    const iniDate = new Date(Date.UTC(ini.ano, ini.mes - 1, ini.dia, 12, 0));
    const fimDate = new Date(Date.UTC(fim.ano, fim.mes - 1, fim.dia, 12, 0));
    const mesmoMes = ini.mes === fim.mes && ini.ano === fim.ano;
    periodoLabel = mesmoMes
      ? `${format(iniDate, "dd", { locale: ptBR })} – ${format(fimDate, "dd 'de' MMM yyyy", { locale: ptBR })}`
      : `${format(iniDate, "dd MMM", { locale: ptBR })} – ${format(fimDate, "dd MMM yyyy", { locale: ptBR })}`;
    refAnterior = chave(addDiasSP(ini, -7));
    refProximo = chave(addDiasSP(ini, 7));
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Calendário da oficina — visão semanal e diária dos agendamentos."
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

      <div className="mb-4">
        <CalendarToggle
          modo="calendario"
          view={view}
          periodoLabel={periodoLabel}
          refData={refStr}
          refAnterior={refAnterior}
          refProximo={refProximo}
          refHoje={hojeStr}
        />
      </div>

      <div className="mb-5">
        <AgendaFiltros
          status={sp.status ?? ""}
          busca=""
          mecanicoId={sp.mecanico ?? ""}
          mecanicos={mecanicos}
          ocultarBusca
        />
      </div>

      {diasAbertos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum dia de expediente neste período"
          message="Configure o expediente em Configurações para ver a grade da agenda."
        />
      ) : (
        <>
          <CalendarWeek
            dias={dias}
            gridStartMin={gridStartMin}
            gridEndMin={gridEndMin}
            slotMin={config.slotMinutos}
          />
          {totalBlocos === 0 && (
            <p className="mt-3 text-center text-sm text-muted">
              Nenhum agendamento neste período.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visão de LISTA (mantém o comportamento original + filtro de mecânico)
// ---------------------------------------------------------------------------

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

function chaveDiaLocal(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

async function ListaView({
  statusFiltro,
  mecanicoFiltro,
  busca,
  statusParam,
  mecanicoParam,
  mecanicos,
  refDia,
  hoje,
  view,
}: {
  statusFiltro?: StatusAgendamento;
  mecanicoFiltro?: string;
  busca: string;
  statusParam: string;
  mecanicoParam: string;
  mecanicos: { id: string; name: string }[];
  refDia: DiaSP;
  hoje: DiaSP;
  view: "semana" | "dia";
}) {
  const where: Prisma.AppointmentWhereInput = {};
  if (statusFiltro) where.status = statusFiltro;
  if (mecanicoFiltro) where.mecanicoId = mecanicoFiltro;
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

  const grupos = new Map<string, { label: string; itens: typeof agendamentos }>();
  for (const a of agendamentos) {
    const key = chaveDiaLocal(a.dataHora);
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

      <div className="mb-4">
        <CalendarToggle
          modo="lista"
          view={view}
          periodoLabel=""
          refData={chave(refDia)}
          refAnterior={chave(refDia)}
          refProximo={chave(refDia)}
          refHoje={chave(hoje)}
        />
      </div>

      <div className="mb-5">
        <AgendaFiltros
          status={statusParam}
          busca={busca}
          mecanicoId={mecanicoParam}
          mecanicos={mecanicos}
        />
      </div>

      {agendamentos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum agendamento encontrado"
          message={
            statusFiltro || mecanicoFiltro || busca
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
