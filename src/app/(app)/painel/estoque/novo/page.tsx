import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PecaForm, type FornecedorOption } from "@/components/estoque/peca-form";

export const dynamic = "force-dynamic";

export default async function NovaPecaPage() {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const fornecedores: FornecedorOption[] = suppliers.map((s) => ({
    id: s.id,
    nome: s.nome,
  }));

  return (
    <div>
      <PageHeader
        title="Nova peça"
        description="Cadastre uma nova peça no estoque."
        icon={PackagePlus}
        action={
          <Link href="/painel/estoque">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <PecaForm fornecedores={fornecedores} />
    </div>
  );
}
