import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardList,
  ArrowLeft,
  User as UserIcon,
  Car,
  Gauge,
  Calendar,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { maskTelefone } from "@/lib/masks";
import { waLink, msgVeiculoPronto } from "@/lib/whatsapp";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrioridadeBadge } from "@/components/ordens/prioridade-badge";
import { StatusActions } from "@/components/ordens/status-actions";
import { CamposForm } from "@/components/ordens/campos-form";
import { ItemAdd } from "@/components/ordens/item-add";
import { ItemList } from "@/components/ordens/item-list";
import { AiButtons } from "@/components/ordens/ai-buttons";
import { MecanicoSelect } from "@/components/ordens/mecanico-select";

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

export default async function OSDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const os = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      mecanico: { select: { id: true, name: true } },
      items: { orderBy: { tipo: "asc" } },
    },
  });

  if (!os) notFound();

  const [servicos, pecas, mecanicos] = await Promise.all([
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
  ]);

  const finalizada = os.status === "ENTREGUE" || os.status === "CANCELADA";

  const items = os.items.map((i) => ({
    id: i.id,
    tipo: i.tipo,
    descricao: i.descricao,
    quantidade: i.quantidade,
    precoUnitario: n(i.precoUnitario),
    subtotal: n(i.subtotal),
  }));

  const valorMaoObra = n(os.valorMaoObra);
  const valorPecas = n(os.valorPecas);
  const desconto = n(os.desconto);
  const total = n(os.total);

  const veiculoLabel = `${os.vehicle.marca} ${os.vehicle.modelo} (${os.vehicle.placa})`;

  // WhatsApp "veículo pronto" — usa whatsapp ou telefone do cliente.
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

  return (
    <div>
      <PageHeader
        title={`OS ${os.numero}`}
        description={`Aberta em ${formatDateTimeBR(os.dataAbertura)}`}
        icon={ClipboardList}
        action={
          <Link href="/ordens-servico">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge kind="os" status={os.status} />
        <PrioridadeBadge prioridade={os.prioridade} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Workflow de status */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de status</CardTitle>
            </CardHeader>
            <CardBody>
              <StatusActions serviceOrderId={os.id} status={os.status} />
            </CardBody>
          </Card>

          {/* Diagnóstico e campos */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico e valores</CardTitle>
            </CardHeader>
            <CardBody>
              <CamposForm
                serviceOrderId={os.id}
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

          {/* Itens */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da OS</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-5">
              <ItemList items={items} podeRemover={!finalizada} />
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
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-5">
          {/* Resumo financeiro */}
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
              </dl>
            </CardBody>
          </Card>

          {/* Cliente e veículo */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente e veículo</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2">
                <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-foreground">{os.customer.nome}</p>
                  {fone && (
                    <p className="text-muted">{maskTelefone(fone)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-foreground">{veiculoLabel}</p>
                  {os.vehicle.ano && (
                    <p className="text-muted">Ano {os.vehicle.ano}</p>
                  )}
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

          {/* Mecânico */}
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

          {/* Ações de IA / WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle>Assistente e comunicação</CardTitle>
            </CardHeader>
            <CardBody>
              <AiButtons serviceOrderId={os.id} whatsappUrl={whatsappUrl} />
            </CardBody>
          </Card>

          <p className="text-xs text-muted">
            Última atualização: {formatDateBR(os.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
