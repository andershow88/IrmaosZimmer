import { Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { createFornecedor } from "@/server/fornecedores";

export const dynamic = "force-dynamic";

export default async function NovoFornecedorPage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Novo fornecedor"
        description="Cadastre um novo fornecedor de peças ou serviços."
        icon={Truck}
      />
      <FornecedorForm action={createFornecedor} submitLabel="Cadastrar fornecedor" />
    </div>
  );
}
