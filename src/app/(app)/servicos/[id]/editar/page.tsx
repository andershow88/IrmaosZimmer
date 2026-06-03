import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ServicoForm, type ServicoFormValues } from "@/components/servicos/servico-form";

export const dynamic = "force-dynamic";

export default async function EditarServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);
  const { id } = await params;

  const servico = await prisma.service.findUnique({ where: { id } });
  if (!servico) notFound();

  const initial: ServicoFormValues = {
    id: servico.id,
    nome: servico.nome,
    categoria: servico.categoria,
    descricao: servico.descricao ?? "",
    precoPadrao: Number(servico.precoPadrao).toFixed(2).replace(".", ","),
    tempoEstimadoMin:
      servico.tempoEstimadoMin != null ? String(servico.tempoEstimadoMin) : "",
    ativo: servico.ativo,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Editar serviço"
        description={servico.nome}
        icon={Wrench}
        action={
          <Link href="/servicos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <ServicoForm mode="edit" initial={initial} />
    </div>
  );
}
