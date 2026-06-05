import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  ArrowLeft,
  Car,
  User as UserIcon,
  Wrench,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Table, THead, TBody, TR, TH } from "@/components/ui/table";
import { formatDateTimeBR } from "@/lib/utils";
import { ItemEditor } from "@/components/checklists/item-editor";
import { ResumoIA } from "@/components/checklists/resumo-ia";
import type { StatusItem } from "@/components/checklists/constants";
import { getModel, isAIAvailable } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export default async function InspecaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const inspecao = await prisma.inspection.findUnique({
    where: { id },
    select: {
      id: true,
      data: true,
      observacoes: true,
      resumoIA: true,
      vehicle: {
        select: {
          marca: true,
          modelo: true,
          placa: true,
          ano: true,
          customer: { select: { nome: true } },
        },
      },
      serviceOrder: { select: { id: true, numero: true } },
      mecanico: { select: { name: true } },
      items: {
        orderBy: { item: "asc" },
        select: { id: true, item: true, status: true, observacao: true },
      },
    },
  });

  if (!inspecao) notFound();

  const criticos = inspecao.items.filter((i) => i.status === "CRITICO").length;
  const atencao = inspecao.items.filter((i) => i.status === "ATENCAO").length;
  const ok = inspecao.items.filter((i) => i.status === "OK").length;

  const veiculoNome = `${inspecao.vehicle.marca} ${inspecao.vehicle.modelo}`;

  return (
    <div>
      <PageHeader
        title={`Inspeção — ${veiculoNome}`}
        description={`${inspecao.vehicle.placa} · ${inspecao.vehicle.customer.nome}`}
        icon={ClipboardCheck}
        action={
          <Link
            href="/painel/checklists"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Itens OK" value={ok} icon={ClipboardCheck} tone="success" />
        <StatCard label="Atenção" value={atencao} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Críticos" value={criticos} icon={ClipboardCheck} tone="danger" />
        <StatCard
          label="Total de itens"
          value={inspecao.items.length}
          icon={ClipboardCheck}
          tone="accent"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens verificados</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Item</TH>
                    <TH>Status</TH>
                    <TH>Observação</TH>
                    <TH className="text-right">Ações</TH>
                  </TR>
                </THead>
                <TBody>
                  {inspecao.items.map((it) => (
                    <ItemEditor
                      key={it.id}
                      id={it.id}
                      item={it.item}
                      status={it.status as StatusItem}
                      observacao={it.observacao}
                    />
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>

          {inspecao.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas técnicas</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {inspecao.observacoes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 text-sm">
              <InfoRow icon={Car} label="Veículo">
                {veiculoNome}
                {inspecao.vehicle.ano ? ` · ${inspecao.vehicle.ano}` : ""}
                {" "}
                <span className="text-muted">({inspecao.vehicle.placa})</span>
              </InfoRow>
              <InfoRow icon={UserIcon} label="Cliente">
                {inspecao.vehicle.customer.nome}
              </InfoRow>
              <InfoRow icon={Wrench} label="Mecânico">
                {inspecao.mecanico?.name ?? (
                  <span className="text-subtle">Não atribuído</span>
                )}
              </InfoRow>
              <InfoRow icon={CalendarDays} label="Data">
                {formatDateTimeBR(inspecao.data)}
              </InfoRow>
              <InfoRow icon={ClipboardCheck} label="Ordem de serviço">
                {inspecao.serviceOrder ? (
                  <Link
                    href={`/painel/ordens-servico/${inspecao.serviceOrder.id}`}
                    className="text-accent hover:underline"
                  >
                    OS {inspecao.serviceOrder.numero}
                  </Link>
                ) : (
                  <span className="text-subtle">Sem vínculo</span>
                )}
              </InfoRow>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <CardTitle>Resumo com IA</CardTitle>
            </CardHeader>
            <CardBody>
              <ResumoIA
                inspectionId={inspecao.id}
                resumo={inspecao.resumoIA}
                aiModel={getModel()}
                aiDemo={!isAIAvailable()}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Car;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="text-foreground">{children}</p>
      </div>
    </div>
  );
}
