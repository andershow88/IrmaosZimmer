import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car,
  ArrowLeft,
  Pencil,
  User,
  ClipboardList,
  ClipboardCheck,
  Camera,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { VeiculoDelete } from "@/components/veiculos/veiculo-delete";
import { COMBUSTIVEL_LABELS } from "@/components/veiculos/constants";
import { AnexoUpload } from "@/components/anexos/anexo-upload";
import { AnexosGaleria } from "@/components/anexos/anexos-galeria";

export const dynamic = "force-dynamic";

function DadoLinha({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export default async function VeiculoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const veiculo = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      placa: true,
      marca: true,
      modelo: true,
      ano: true,
      cor: true,
      quilometragem: true,
      chassi: true,
      renavam: true,
      combustivel: true,
      observacoes: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          whatsapp: true,
        },
      },
      serviceOrders: {
        orderBy: { dataAbertura: "desc" },
        select: {
          id: true,
          numero: true,
          dataAbertura: true,
          status: true,
          total: true,
          problemaRelatado: true,
        },
      },
      inspections: {
        orderBy: { data: "desc" },
        select: {
          id: true,
          data: true,
          observacoes: true,
          mecanico: { select: { name: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!veiculo) notFound();

  // Anexos do veículo (Attachment.vehicleId não possui back-relation no schema).
  const anexos = await prisma.attachment.findMany({
    where: { vehicleId: veiculo.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      nome: true,
      tipo: true,
      createdAt: true,
    },
  });

  const descricao = `${veiculo.marca} ${veiculo.modelo} — ${veiculo.placa}`;

  return (
    <div>
      <PageHeader
        title={`${veiculo.marca} ${veiculo.modelo}`}
        description={
          veiculo.placa + (veiculo.ano ? ` • ${veiculo.ano}` : "")
        }
        icon={Car}
        action={
          <div className="flex items-center gap-2">
            <Link href="/veiculos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <Link href={`/veiculos/${veiculo.id}/editar`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <VeiculoDelete veiculoId={veiculo.id} descricao={descricao} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dados do veículo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do veículo</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              <DadoLinha
                label="Placa"
                value={
                  <span className="font-mono tracking-wide">
                    {veiculo.placa}
                  </span>
                }
              />
              <DadoLinha label="Marca" value={veiculo.marca} />
              <DadoLinha label="Modelo" value={veiculo.modelo} />
              <DadoLinha label="Ano" value={veiculo.ano} />
              <DadoLinha label="Cor" value={veiculo.cor} />
              <DadoLinha
                label="Quilometragem"
                value={
                  veiculo.quilometragem != null
                    ? `${formatNumber(veiculo.quilometragem)} km`
                    : null
                }
              />
              <DadoLinha
                label="Combustível"
                value={
                  veiculo.combustivel ? (
                    <Badge variant="outline">
                      {COMBUSTIVEL_LABELS[veiculo.combustivel]}
                    </Badge>
                  ) : null
                }
              />
              <DadoLinha label="Renavam" value={veiculo.renavam} />
              <DadoLinha
                label="Chassi"
                value={
                  veiculo.chassi ? (
                    <span className="font-mono text-xs">{veiculo.chassi}</span>
                  ) : null
                }
              />
            </dl>

            {veiculo.observacoes && (
              <div className="mt-5 border-t border-border pt-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Observações
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {veiculo.observacoes}
                </dd>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Proprietário */}
        <Card>
          <CardHeader>
            <CardTitle>Proprietário</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <User className="h-5 w-5" />
              </div>
              <div>
                <Link
                  href={`/clientes/${veiculo.customer.id}`}
                  className="font-semibold text-foreground hover:text-accent"
                >
                  {veiculo.customer.nome}
                </Link>
                <p className="text-xs text-muted">
                  {veiculo.customer.telefone ||
                    veiculo.customer.whatsapp ||
                    "Sem contato"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted">
              Cadastrado em {formatDateBR(veiculo.createdAt)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Histórico de OS */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico de ordens de serviço</CardTitle>
        </CardHeader>
        <CardBody>
          {veiculo.serviceOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhuma ordem de serviço"
              message="Este veículo ainda não possui ordens de serviço."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Número</TH>
                  <TH>Abertura</TH>
                  <TH>Problema</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {veiculo.serviceOrders.map((os) => (
                  <TR key={os.id}>
                    <TD className="font-semibold">
                      <Link
                        href={`/ordens-servico/${os.id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {os.numero}
                      </Link>
                    </TD>
                    <TD className="whitespace-nowrap">
                      {formatDateBR(os.dataAbertura)}
                    </TD>
                    <TD className="max-w-xs truncate text-muted">
                      {os.problemaRelatado || "—"}
                    </TD>
                    <TD>
                      <StatusBadge kind="os" status={os.status} />
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatBRL(os.total)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Inspeções */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inspeções</CardTitle>
        </CardHeader>
        <CardBody>
          {veiculo.inspections.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nenhuma inspeção"
              message="Este veículo ainda não possui inspeções registradas."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Data</TH>
                  <TH>Mecânico</TH>
                  <TH>Itens</TH>
                  <TH>Observações</TH>
                </TR>
              </THead>
              <TBody>
                {veiculo.inspections.map((insp) => (
                  <TR key={insp.id}>
                    <TD className="whitespace-nowrap">
                      <Link
                        href={`/checklists/${insp.id}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {formatDateBR(insp.data)}
                      </Link>
                    </TD>
                    <TD>{insp.mecanico?.name || "—"}</TD>
                    <TD className="tabular-nums">{insp._count.items}</TD>
                    <TD className="max-w-xs truncate text-muted">
                      {insp.observacoes || "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Fotos / Anexos */}
      <Card className="mt-6">
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Camera className="h-4 w-4 text-accent" />
              Fotos
            </span>
          </CardTitle>
          <AnexoUpload vehicleId={veiculo.id} label="Enviar foto" />
        </CardHeader>
        <CardBody>
          <AnexosGaleria anexos={anexos} />
        </CardBody>
      </Card>
    </div>
  );
}
