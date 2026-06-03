"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Pencil,
  KeyRound,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { formatDateBR } from "@/lib/utils";
import { toggleAtivo, resetSenha } from "@/server/configuracoes";
import { ResetSenhaDialog } from "@/components/configuracoes/reset-senha-dialog";

export type UsuarioRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  ativo: boolean;
  telefone: string | null;
  lastLoginAt: string | null;
};

const ROLE_VARIANT: Record<Role, "accent" | "info" | "warning" | "success" | "default"> = {
  ADMINISTRADOR: "accent",
  ATENDENTE: "info",
  MECANICO: "warning",
  FINANCEIRO: "success",
  ESTOQUE: "default",
};

const ALL_ROLES: Role[] = [
  "ADMINISTRADOR",
  "ATENDENTE",
  "MECANICO",
  "FINANCEIRO",
  "ESTOQUE",
];

export function UsuariosLista({
  usuarios,
  currentUserId,
}: {
  usuarios: UsuarioRow[];
  currentUserId: string;
}) {
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<string>("");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<UsuarioRow | null>(null);
  const [resetAlvo, setResetAlvo] = useState<UsuarioRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (termo) {
        const alvo = `${u.name} ${u.email}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (filtroRole && u.role !== filtroRole) return false;
      if (filtroAtivo === "ativo" && !u.ativo) return false;
      if (filtroAtivo === "inativo" && u.ativo) return false;
      return true;
    });
  }, [usuarios, busca, filtroRole, filtroAtivo]);

  function handleToggle() {
    if (!confirm) return;
    const alvo = confirm;
    setErro(null);
    startTransition(async () => {
      const res = await toggleAtivo({ id: alvo.id, ativo: !alvo.ativo });
      if (!res.ok) setErro(res.error);
      setConfirm(null);
    });
  }

  async function handleReset(senha: string) {
    if (!resetAlvo) return { ok: false as const, error: "Usuário inválido." };
    const res = await resetSenha({ id: resetAlvo.id, senha });
    return res;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9"
              aria-label="Buscar usuário"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filtroRole}
              onChange={(e) => setFiltroRole(e.target.value)}
              aria-label="Filtrar por função"
              className="sm:w-44"
            >
              <option value="">Todas as funções</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <Select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value)}
              aria-label="Filtrar por situação"
              className="sm:w-36"
            >
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </Select>
          </div>
        </div>
        <Link href="/configuracoes/usuarios/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        </Link>
      </div>

      {erro && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {erro}
        </div>
      )}

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          message={
            usuarios.length === 0
              ? "Cadastre o primeiro usuário da oficina."
              : "Ajuste a busca ou os filtros para ver outros usuários."
          }
          action={
            usuarios.length === 0 ? (
              <Link href="/configuracoes/usuarios/novo">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Novo usuário
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>E-mail</TH>
              <TH>Função</TH>
              <TH>Situação</TH>
              <TH>Último acesso</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {filtrados.map((u) => (
              <TR key={u.id}>
                <TD className="font-semibold">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-muted">(você)</span>
                  )}
                </TD>
                <TD className="text-muted">{u.email}</TD>
                <TD>
                  <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                </TD>
                <TD>
                  {u.ativo ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </TD>
                <TD className="text-muted">
                  {u.lastLoginAt ? formatDateBR(u.lastLoginAt) : "—"}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/configuracoes/usuarios/${u.id}/editar`}>
                      <Button variant="ghost" size="icon" aria-label="Editar usuário">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Redefinir senha"
                      onClick={() => setResetAlvo(u)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={u.ativo ? "Desativar usuário" : "Ativar usuário"}
                      disabled={u.id === currentUserId && u.ativo}
                      onClick={() => setConfirm(u)}
                    >
                      {u.ativo ? (
                        <PowerOff className="h-4 w-4 text-danger" />
                      ) : (
                        <Power className="h-4 w-4 text-success" />
                      )}
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.ativo ? "Desativar usuário" : "Ativar usuário"}
        description={
          confirm
            ? confirm.ativo
              ? `Desativar ${confirm.name}? O usuário não poderá mais acessar o sistema.`
              : `Reativar o acesso de ${confirm.name}?`
            : undefined
        }
        confirmLabel={confirm?.ativo ? "Desativar" : "Ativar"}
        variant={confirm?.ativo ? "danger" : "primary"}
        loading={pending}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(null)}
      />

      <ResetSenhaDialog
        open={resetAlvo !== null}
        usuarioNome={resetAlvo?.name ?? ""}
        onClose={() => setResetAlvo(null)}
        onSubmit={handleReset}
      />
    </div>
  );
}
