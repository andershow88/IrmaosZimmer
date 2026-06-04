import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PagamentoForm, type OsOption } from "@/components/pagamentos/pagamento-form";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EditarPagamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["FINANCEIRO", "ADMINISTRADOR"]);
  const { id } = await params;

  const pagamento = await prisma.payment.findUnique({
    where: { id },
    include: {
      serviceOrder: { select: { customer: { select: { nome: true } } } },
    },
  });

  if (!pagamento) notFound();

  const ordens = await prisma.serviceOrder.findMany({
    where: { status: { notIn: ["CANCELADA"] } },
    orderBy: { dataAbertura: "desc" },
    select: {
      id: true,
      numero: true,
      total: true,
      customer: { select: { nome: true } },
    },
    take: 200,
  });

  const options: OsOption[] = ordens.map((o) => ({
    id: o.id,
    numero: o.numero,
    cliente: o.customer.nome,
    total: Number(o.total),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Editar pagamento"
        description="Atualize os valores, a forma ou o status do recebimento."
        icon={CreditCard}
        action={
          <Link href={`/painel/pagamentos/${pagamento.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <PagamentoForm
        ordens={options}
        initial={{
          id: pagamento.id,
          serviceOrderId: pagamento.serviceOrderId,
          valorTotal: Number(pagamento.valorTotal),
          valorPago: Number(pagamento.valorPago),
          forma: pagamento.forma,
          dataPagamento: toDateInput(pagamento.dataPagamento),
          observacoes: pagamento.observacoes,
        }}
      />
    </div>
  );
}
