import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ClipboardList,
  ArrowLeft,
  User as UserIcon,
  Car,
  Gauge,
  Calendar,
  Wrench,
  ShieldCheck,
  ClipboardCheck,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser, getSession } from "@/lib/auth";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { maskTelefone } from "@/lib/masks";
import { waLink, msgVeiculoPronto } from "@/lib/whatsapp";
import { getOSTimeline } from "@/server/ordens";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PrioridadeBadge } from "@/components/ordens/prioridade-badge";
import { StatusActions } from "@/components/ordens/status-actions";
import { CamposForm } from "@/components/ordens/campos-form";
import { ItemAdd } from "@/components/ordens/item-add";
import { ItemList } from "@/components/ordens/item-list";
import { AiButtons } from "@/components/ordens/ai-buttons";
import { MecanicoSelect } from "@/components/ordens/mecanico-select";
import { GarantiaForm } from "@/components/garantias/garantia-form";
import { GarantiasList } from "@/components/garantias/garantias-list";
import {
  AnexosSecao,
  AnexosSecaoFallback,
} from "@/components/anexos/anexos-secao";
import { HorasSecao } from "@/components/ordens/horas-secao";
import { OSWorkspace } from "@/components/ordens/os-workspace";
import { OSTimeline } from "@/components/ordens/os-timeline";
import type { OSHeaderData } from "@/components/ordens/os-header";

export const dynamic = "force-dynamic";

/** Converte Decimal/null em number. */
function n(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const x = Number(v.toString());
  return Number.isFinite(x) ? x : 0;
}

/** Formata um Date em string compatível com input datetime-local. */
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Rótulo da próxima ação primária do status atual (espelha a regra do servidor). */
const PROXIMA_ACAO: Record<string, string | null> = {
  ABERTA: "Iniciar diagnóstico",
  AGUARDANDO_DIAGNOSTICO: "Enviar p/ aprovação",
  AGUARDANDO_APROVACAO: "Aprovar",
  APROVADA: "Iniciar execução",
  EM_EXECUCAO: "Concluir",
  AGUARDANDO_PECAS: "Retomar execução",
  CONCLUIDA: "Marcar entregue",
  ENTREGUE: null,
  CANCELADA: null,
};

const FORM_ID = "os-campos-form";

export default async function OSDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const session = await getSession();
  const { id } = await params;

  const os = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      mecanico: { select: { id: true, name: true } },
      items: { orderBy: { tipo: "asc" } },
      warranties: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      inspections: {
        orderBy: { data: "desc" },
        include: {
          mecanico: { select: { name: true } },
          items: { select: { status: true } },
        },
      },
      timeEntries: {
        orderBy: { inicio: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!os) notFound();

  const [servicos, pecas, mecanicos, timeline] = await Promise.all([
    prisma.service.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoPadrao: true },
    }),
    prisma.part.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        codigoInterno: true,
        precoVenda: true,
        quantidade: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "MECANICO", ativo: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getOSTimeline(id),
  ]);

  const finalizada = os.status === "ENTREGUE" || os.status === "CANCELADA";

  const items = os.items.map((i) => ({
    id: i.id,
    tipo: i.tipo,
    descricao: i.descricao,
    quantidade: i.quantidade,
    precoUnitario: n(i.precoUnitario),
    subtotal: n(i.subtotal),
    serviceId: i.serviceId,
    partId: i.partId,
  }));

  const valorMaoObra = n(os.valorMaoObra);
  const valorPecas = n(os.valorPecas);
  const desconto = n(os.desconto);
  const total = n(os.total);

  // Apontamentos de horas para a aba "Horas".
  const apontamentos = os.timeEntries.map((t) => ({
    id: t.id,
    mecanico: t.user?.name ?? "—",
    inicio: t.inicio,
    fim: t.fim,
    minutos: t.minutos,
    emAndamento: t.fim == null,
  }));
  const apontamentoAbertoId =
    os.timeEntries.find((t) => t.fim == null && t.userId === session?.id)?.id ??
    null;

  const veiculoLabel = `${os.vehicle.marca} ${os.vehicle.modelo} (${os.vehicle.placa})`;

  // WhatsApp "veículo pronto".
  const fone = os.customer.whatsapp || os.customer.telefone || "";
  const whatsappUrl = fone
    ? waLink(
        fone,
        msgVeiculoPronto({
          cliente: os.customer.nome,
          veiculo: veiculoLabel,
          numeroOS: os.numero,
        })
      )
    : null;

  // Status de pagamento resumido (do pagamento mais recente).
  const pagamentoStatus = os.payments[0]?.status ?? null;
  const hasPagamento = os.payments.length > 0;

  const header: OSHeaderData = {
    numero: os.numero,
    status: os.status,
    cliente: os.customer.nome,
    veiculo: `${os.vehicle.marca} ${os.vehicle.modelo}`,
    placa: os.vehicle.placa,
    km: os.quilometragem ?? null,
    mecanico: os.mecanico?.name ?? null,
    previsaoEntrega: os.previsaoEntrega,
    total,
    pagamentoStatus,
  };

  const proximaAcaoLabel = finalizada ? null : PROXIMA_ACAO[os.status] ?? null;

  const imprimirHref = `/painel/ordens-servico/${os.id}/imprimir`;
  const pagamentoHref = "/painel/pagamentos/novo";

  // ----- Slots de conteúdo das abas -----

  const visaoGeral = (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de status</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="os" status={os.status} />
              <PrioridadeBadge prioridade={os.prioridade} />
            </div>
            <StatusActions
              serviceOrderId={os.id}
              status={os.status}
              hasItems={items.length > 0}
              hasPagamento={hasPagamento}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico e valores</CardTitle>
          </CardHeader>
          <CardBody>
            <CamposForm
              serviceOrderId={os.id}
              formId={FORM_ID}
              hideSubmit
              iniciais={{
                problemaRelatado: os.problemaRelatado ?? "",
                diagnostico: os.diagnostico ?? "",
                valorMaoObra,
                desconto,
                previsaoEntrega: toLocalInput(os.previsaoEntrega),
                obsInternas: os.obsInternas ?? "",
                obsCliente: os.obsCliente ?? "",
              }}
            />
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Resumo financeiro</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Mão de obra</dt>
                <dd className="font-medium tabular-nums">{formatBRL(valorMaoObra)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Peças</dt>
                <dd className="font-medium tabular-nums">{formatBRL(valorPecas)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Desconto</dt>
                <dd className="font-medium tabular-nums text-danger">
                  − {formatBRL(desconto)}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-2">
                <dt className="font-bold text-foreground">Total</dt>
                <dd className="text-lg font-bold tabular-nums text-accent">
                  {formatBRL(total)}
                </dd>
              </div>
              {pagamentoStatus && (
                <div className="mt-1 flex items-center justify-between">
                  <dt className="text-muted">Pagamento</dt>
                  <dd>
                    <StatusBadge kind="pagamento" status={pagamentoStatus} />
                  </dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente e veículo</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2">
              <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-foreground">{os.customer.nome}</p>
                {fone && <p className="text-muted">{maskTelefone(fone)}</p>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-foreground">{veiculoLabel}</p>
                {os.vehicle.ano && <p className="text-muted">Ano {os.vehicle.ano}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-muted" />
              <span className="text-foreground">
                {os.quilometragem != null
                  ? `${os.quilometragem.toLocaleString("pt-BR")} km`
                  : "Quilometragem não informada"}
              </span>
            </div>
            {os.previsaoEntrega && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-foreground">
                  Previsão: {formatDateTimeBR(os.previsaoEntrega)}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mecânico responsável</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <Wrench className="h-4 w-4" />
              {os.mecanico ? os.mecanico.name : "Nenhum mecânico atribuído"}
            </div>
            <MecanicoSelect
              serviceOrderId={os.id}
              mecanicoId={os.mecanico?.id ?? null}
              mecanicos={mecanicos}
            />
          </CardBody>
        </Card>

        <p className="text-xs text-muted">
          Última atualização: {formatDateBR(os.updatedAt)}
        </p>
      </div>
    </div>
  );

  const servicosPecas = (
    <Card>
      <CardHeader>
        <CardTitle>Serviços e peças</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <ItemList serviceOrderId={os.id} items={items} podeRemover={!finalizada} />
        {!finalizada && (
          <ItemAdd
            serviceOrderId={os.id}
            servicos={servicos.map((s) => ({
              id: s.id,
              nome: s.nome,
              precoPadrao: n(s.precoPadrao),
            }))}
            pecas={pecas.map((p) => ({
              id: p.id,
              nome: p.nome,
              codigoInterno: p.codigoInterno,
              precoVenda: n(p.precoVenda),
              quantidade: p.quantidade,
            }))}
          />
        )}
      </CardBody>
    </Card>
  );

  const checklist = (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-accent" />
            Checklists / inspeções
          </span>
        </CardTitle>
        <Link href={`/painel/checklists/novo?os=${os.id}`}>
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4" />
            Nova inspeção
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        {os.inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nenhuma inspeção registrada"
            message="Crie um checklist de inspeção vinculado a esta OS."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {os.inspections.map((insp) => {
              const criticos = insp.items.filter(
                (it) => it.status === "CRITICO"
              ).length;
              const atencao = insp.items.filter(
                (it) => it.status === "ATENCAO"
              ).length;
              return (
                <li key={insp.id}>
                  <Link
                    href={`/painel/checklists/${insp.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3 transition hover:border-border-strong/70 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        Inspeção de {formatDateBR(insp.data)}
                      </p>
                      <p className="text-xs text-muted">
                        {insp.items.length} itens
                        {insp.mecanico?.name ? ` · ${insp.mecanico.name}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {criticos > 0 && (
                        <Badge variant="danger">
                          <AlertTriangle className="h-3 w-3" />
                          {criticos} crítico{criticos > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {atencao > 0 && (
                        <Badge variant="warning">{atencao} atenção</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );

  const horas = (
    <HorasSecao
      serviceOrderId={os.id}
      tempoPrevistoMin={os.tempoPrevistoMin}
      apontamentos={apontamentos}
      apontamentoAbertoId={apontamentoAbertoId}
      desabilitado={finalizada}
    />
  );

  const comunicacao = (
    <Card>
      <CardHeader>
        <CardTitle>Comunicação e assistente</CardTitle>
      </CardHeader>
      <CardBody>
        <AiButtons serviceOrderId={os.id} whatsappUrl={whatsappUrl} />
      </CardBody>
    </Card>
  );

  const garantias = (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Garantias
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <GarantiasList
          garantias={os.warranties.map((g) => ({
            id: g.id,
            descricao: g.descricao,
            validadeAte: g.validadeAte,
            observacoes: g.observacoes,
            createdAt: g.createdAt,
          }))}
        />
        <GarantiaForm serviceOrderId={os.id} />
      </CardBody>
    </Card>
  );

  const anexos = (
    <Suspense fallback={<AnexosSecaoFallback />}>
      <AnexosSecao serviceOrderId={os.id} />
    </Suspense>
  );

  const historico = (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de atividades</CardTitle>
      </CardHeader>
      <CardBody>
        <OSTimeline eventos={timeline} />
      </CardBody>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={`OS ${os.numero}`}
        description={`Aberta em ${formatDateTimeBR(os.dataAbertura)}`}
        icon={ClipboardList}
        action={
          <Link href="/painel/ordens-servico">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <OSWorkspace
        header={header}
        proximaAcaoLabel={proximaAcaoLabel}
        formId={FORM_ID}
        whatsappUrl={whatsappUrl}
        imprimirHref={imprimirHref}
        pagamentoHref={pagamentoHref}
        podeSalvar={!finalizada}
        slots={{
          visaoGeral,
          servicosPecas,
          checklist,
          horas,
          comunicacao,
          garantias,
          anexos,
          historico,
        }}
      />
    </div>
  );
}
