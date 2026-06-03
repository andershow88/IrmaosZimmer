import Link from "next/link";
import { FileText, Plus, CheckCircle2, Send, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { OrcamentosList } from "@/components/orcamentos/orcamentos-list";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage() {
  await requireUser();

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { nome: true } },
      vehicle: { select: { placa: true, marca: true, modelo: true } },
    },
  });

  const rows = quotes.map((q) => ({
    id: q.id,
    numero: q.numero,
    status: q.status,
    total: Number(q.total),
    validade: q.validade ? q.validade.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    clienteNome: q.customer.nome,
    veiculoLabel: `${q.vehicle.marca} ${q.vehicle.modelo} • ${q.vehicle.placa}`,
  }));

  const totalAprovado = quotes
    .filter((q) => q.status === "APROVADO")
    .reduce((acc, q) => acc + Number(q.total), 0);
  const enviados = quotes.filter((q) => q.status === "ENVIADO").length;
  const rascunhos = quotes.filter((q) => q.status === "RASCUNHO").length;

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Crie, envie e acompanhe os orçamentos da oficina."
        icon={FileText}
        action={
          <Link href="/orcamentos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={String(quotes.length)} icon={FileText} tone="accent" />
        <StatCard label="Rascunhos" value={String(rascunhos)} icon={Clock} tone="info" />
        <StatCard label="Enviados" value={String(enviados)} icon={Send} tone="warning" />
        <StatCard
          label="Aprovado (R$)"
          value={formatBRL(totalAprovado)}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <OrcamentosList rows={rows} />
    </div>
  );
}
