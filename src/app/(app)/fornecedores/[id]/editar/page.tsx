import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { updateFornecedor } from "@/server/fornecedores";

export const dynamic = "force-dynamic";

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const fornecedor = await prisma.supplier.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      cnpj: true,
      contato: true,
      telefone: true,
      whatsapp: true,
      email: true,
      endereco: true,
      observacoes: true,
    },
  });

  if (!fornecedor) notFound();

  const action = updateFornecedor.bind(null, fornecedor.id);

  return (
    <div>
      <PageHeader
        title="Editar fornecedor"
        description={fornecedor.nome}
        icon={Truck}
      />
      <FornecedorForm
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={{
          nome: fornecedor.nome,
          cnpj: fornecedor.cnpj ?? "",
          contato: fornecedor.contato ?? "",
          telefone: fornecedor.telefone ?? "",
          whatsapp: fornecedor.whatsapp ?? "",
          email: fornecedor.email ?? "",
          endereco: fornecedor.endereco ?? "",
          observacoes: fornecedor.observacoes ?? "",
        }}
      />
    </div>
  );
}
