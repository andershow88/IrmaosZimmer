import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  PecaForm,
  type FornecedorOption,
  type PecaFormValues,
} from "@/components/estoque/peca-form";

export const dynamic = "force-dynamic";

export default async function EditarPecaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);
  const { id } = await params;

  const [part, suppliers] = await Promise.all([
    prisma.part.findUnique({ where: { id } }),
    prisma.supplier.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!part) notFound();

  const fornecedores: FornecedorOption[] = suppliers.map((s) => ({
    id: s.id,
    nome: s.nome,
  }));

  const initial: PecaFormValues = {
    id: part.id,
    nome: part.nome,
    codigoInterno: part.codigoInterno,
    categoria: part.categoria ?? "",
    supplierId: part.supplierId ?? "",
    precoCusto: Number(part.precoCusto),
    precoVenda: Number(part.precoVenda),
    quantidade: part.quantidade,
    estoqueMinimo: part.estoqueMinimo,
    localizacao: part.localizacao ?? "",
    compatibilidade: part.compatibilidade ?? "",
  };

  return (
    <div>
      <PageHeader
        title="Editar peça"
        description={part.nome}
        icon={Pencil}
        action={
          <Link href="/estoque">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <PecaForm fornecedores={fornecedores} initial={initial} />
    </div>
  );
}
