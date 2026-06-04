import Link from "next/link";
import { CreditCard, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PagamentoForm, type OsOption } from "@/components/pagamentos/pagamento-form";

export const dynamic = "force-dynamic";

export default async function NovoPagamentoPage() {
  await requirePageRole(["FINANCEIRO", "ADMINISTRADOR"]);

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
        title="Novo pagamento"
        description="Registre um recebimento vinculado a uma ordem de serviço."
        icon={CreditCard}
        action={
          <Link href="/painel/pagamentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      {options.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma ordem de serviço disponível"
          message="Cadastre uma ordem de serviço antes de registrar um pagamento."
        />
      ) : (
        <PagamentoForm ordens={options} />
      )}
    </div>
  );
}
