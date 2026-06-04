import Link from "next/link";
import { notFound } from "next/navigation";
import { UserCog, ShieldAlert, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UsuarioForm } from "@/components/configuracoes/usuario-form";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  if (user.role !== "ADMINISTRADOR") {
    return (
      <div>
        <PageHeader title="Editar usuário" icon={UserCog} />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          message="Apenas administradores podem editar usuários."
        />
      </div>
    );
  }

  const { id } = await params;
  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ativo: true,
      telefone: true,
    },
  });

  if (!usuario) notFound();

  return (
    <div>
      <PageHeader
        title="Editar usuário"
        description={usuario.name}
        icon={UserCog}
        action={
          <Link href="/painel/configuracoes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <UsuarioForm
        mode="editar"
        usuario={{
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          role: usuario.role,
          ativo: usuario.ativo,
          telefone: usuario.telefone,
        }}
      />
    </div>
  );
}
