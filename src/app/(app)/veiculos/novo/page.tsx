import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { VeiculoForm } from "@/components/veiculos/veiculo-form";

export const dynamic = "force-dynamic";

export default async function NovoVeiculoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await requireUser();
  const { cliente } = await searchParams;

  const clientes = await prisma.customer.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <PageHeader
        title="Novo veículo"
        description="Cadastre um veículo e vincule a um cliente."
        icon={Car}
        action={
          <Link href="/veiculos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <VeiculoForm clientes={clientes} defaultCustomerId={cliente} />
    </div>
  );
}
