import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ClienteForm } from "@/components/clientes/cliente-form";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const cliente = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      tipoPessoa: true,
      cpfCnpj: true,
      telefone: true,
      whatsapp: true,
      email: true,
      endereco: true,
      cidade: true,
      estado: true,
      cep: true,
      observacoes: true,
      lgpdConsent: true,
    },
  });

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader
        title="Editar cliente"
        description={cliente.nome}
        icon={Pencil}
        action={
          <Link href={`/clientes/${cliente.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <ClienteForm
        initial={{
          id: cliente.id,
          nome: cliente.nome,
          tipoPessoa: cliente.tipoPessoa,
          cpfCnpj: cliente.cpfCnpj ?? "",
          telefone: cliente.telefone ?? "",
          whatsapp: cliente.whatsapp ?? "",
          email: cliente.email ?? "",
          endereco: cliente.endereco ?? "",
          cidade: cliente.cidade ?? "",
          estado: cliente.estado ?? "",
          cep: cliente.cep ?? "",
          observacoes: cliente.observacoes ?? "",
          lgpdConsent: cliente.lgpdConsent,
        }}
      />
    </div>
  );
}
