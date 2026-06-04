import { Settings, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfiguracoesTabs } from "@/components/configuracoes/tabs";
import {
  UsuariosLista,
  type UsuarioRow,
} from "@/components/configuracoes/usuarios-lista";
import { PermissoesSecao } from "@/components/configuracoes/permissoes-sec";
import { OficinaSecao } from "@/components/configuracoes/oficina-sec";
import { AgendaSecao } from "@/components/configuracoes/agenda-sec";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const user = await requireUser();

  if (user.role !== "ADMINISTRADOR") {
    return (
      <div>
        <PageHeader
          title="Configurações"
          description="Usuários, permissões e dados da oficina."
          icon={Settings}
        />
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          message="Apenas administradores podem acessar as configurações do sistema. Fale com um administrador caso precise de ajuste."
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
        title="Configurações"
        description="Usuários, permissões e dados da oficina."
        icon={Settings}
      />

      <ConfiguracoesTabs
        usuarios={
          <UsuariosLista usuarios={usuarios} currentUserId={user.id} />
        }
        permissoes={<PermissoesSecao />}
        oficina={<OficinaSecao />}
        agenda={<AgendaSecao />}
      />
    </div>
  );
}
