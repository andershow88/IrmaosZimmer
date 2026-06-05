import { UserCog, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  UsuariosLista,
  type UsuarioRow,
} from "@/components/configuracoes/usuarios-lista";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const user = await requireUser();

  if (user.role !== "ADMINISTRADOR") {
    return (
      <div>
        <PageHeader
          title="Usuários"
          description="Equipe com acesso ao sistema."
          icon={UserCog}
        />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          message="Apenas administradores podem gerenciar usuários. Fale com um administrador caso precise de ajuste."
        />
      </div>
    );
  }

  const usuariosDb = await prisma.user.findMany({
    orderBy: [{ ativo: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ativo: true,
      telefone: true,
      lastLoginAt: true,
    },
  });

  const usuarios: UsuarioRow[] = usuariosDb.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    telefone: u.telefone,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Equipe com acesso ao sistema, papéis e último acesso."
        icon={UserCog}
      />

      <UsuariosLista usuarios={usuarios} currentUserId={user.id} />
    </div>
  );
}
