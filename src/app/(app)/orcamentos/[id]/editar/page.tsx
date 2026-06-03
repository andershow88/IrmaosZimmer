import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getOrcamento } from "@/components/orcamentos/get-orcamento";
import { OrcamentoEdit } from "@/components/orcamentos/orcamento-edit";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const orcamento = await getOrcamento(id);
  if (!orcamento) notFound();

  // Só rascunhos podem ser editados.
  if (orcamento.status !== "RASCUNHO") {
    redirect(`/orcamentos/${id}`);
  }

  const [servicos, pecas] = await Promise.all([
    prisma.service.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoPadrao: true },
    }),
    prisma.part.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, codigoInterno: true, precoVenda: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Editar ${orcamento.numero}`}
        description="Ajuste itens e condições do orçamento (rascunho)."
        icon={Pencil}
        action={
          <Link href={`/orcamentos/${id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <OrcamentoEdit
        orcamento={orcamento}
        servicos={servicos.map((s) => ({
          id: s.id,
          nome: s.nome,
          precoPadrao: Number(s.precoPadrao),
        }))}
        pecas={pecas.map((p) => ({
          id: p.id,
          nome: p.nome,
          codigoInterno: p.codigoInterno,
          precoVenda: Number(p.precoVenda),
        }))}
      />
    </div>
  );
}
