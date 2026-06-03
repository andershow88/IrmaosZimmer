import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ServicoForm, type ServicoFormValues } from "@/components/servicos/servico-form";

export const dynamic = "force-dynamic";

const emptyServico: ServicoFormValues = {
  nome: "",
  categoria: "",
  descricao: "",
  precoPadrao: "",
  tempoEstimadoMin: "",
  ativo: true,
};

export default async function NovoServicoPage() {
  await requirePageRole(["ESTOQUE", "ADMINISTRADOR"]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Novo serviço"
        description="Adicione um serviço ao catálogo da oficina."
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
      <ServicoForm mode="create" initial={emptyServico} />
    </div>
  );
}
