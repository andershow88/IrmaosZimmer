"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeBR } from "@/lib/utils";

export type AuditLogRow = {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  detalhe: string | null;
  usuarioNome: string | null;
  usuarioEmail: string | null;
  createdAt: string;
};

const ACAO_VARIANT: Record<string, BadgeVariant> = {
  CRIAR: "success",
  ATUALIZAR: "info",
  EXCLUIR: "danger",
  ATIVAR: "success",
  DESATIVAR: "warning",
  REDEFINIR_SENHA: "warning",
};

function acaoVariant(acao: string): BadgeVariant {
  return ACAO_VARIANT[acao] ?? "default";
}

export function AuditoriaLista({ logs }: { logs: AuditLogRow[] }) {
  const [busca, setBusca] = useState("");
  const [entidade, setEntidade] = useState("");

  const entidades = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entidade))).sort(),
    [logs]
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return logs.filter((l) => {
      if (entidade && l.entidade !== entidade) return false;
      if (!q) return true;
      return (
        l.acao.toLowerCase().includes(q) ||
        l.entidade.toLowerCase().includes(q) ||
        (l.detalhe?.toLowerCase().includes(q) ?? false) ||
        (l.usuarioNome?.toLowerCase().includes(q) ?? false) ||
        (l.usuarioEmail?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [logs, busca, entidade]);

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Nenhum registro de auditoria"
        message="As ações sensíveis realizadas no sistema aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ação, usuário ou detalhe..."
            className="pl-10"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
            aria-label="Filtrar por entidade"
          >
            <option value="">Todas as entidades</option>
            {entidades.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum registro encontrado"
          message="Ajuste os filtros para ver os registros de auditoria."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Data / hora</TH>
              <TH>Usuário</TH>
              <TH>Ação</TH>
              <TH>Entidade</TH>
              <TH>Detalhe</TH>
            </TR>
          </THead>
          <TBody>
            {filtrados.map((l) => (
              <TR key={l.id}>
                <TD className="whitespace-nowrap text-xs text-muted">
                  {formatDateTimeBR(l.createdAt)}
                </TD>
                <TD className="whitespace-nowrap">
                  {l.usuarioNome ? (
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {l.usuarioNome}
                      </p>
                      {l.usuarioEmail && (
                        <p className="text-xs text-muted">{l.usuarioEmail}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Sistema</span>
                  )}
                </TD>
                <TD>
                  <Badge variant={acaoVariant(l.acao)}>{l.acao}</Badge>
                </TD>
                <TD className="whitespace-nowrap text-sm text-foreground">
                  {l.entidade}
                </TD>
                <TD className="text-sm text-muted">{l.detalhe ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
