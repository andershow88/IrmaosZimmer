import Link from "next/link";
import { UserPlus, ShieldAlert, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UsuarioForm } from "@/components/configuracoes/usuario-form";

export const dynamic = "force-dynamic";

export default async function NovoUsuarioPage() {
  const user = await requireUser();

  if (user.role !== "ADMINISTRADOR") {
    return (
      <div>
        <PageHeader title="Novo usuário" icon={UserPlus} />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          message="Apenas administradores podem cadastrar usuários."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Novo usuário"
        description="Cadastre um novo usuário e defina a função dele."
        icon={UserPlus}
        action={
          <Link href="/configuracoes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <UsuarioForm mode="novo" />
    </div>
  );
}
