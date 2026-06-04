"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import type { StatusOrcamento } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL, formatDateBR } from "@/lib/utils";

type Row = {
  id: string;
  numero: string;
  status: StatusOrcamento;
  total: number;
  validade: string | null;
  createdAt: string;
  clienteNome: string;
  veiculoLabel: string;
};

const STATUS_OPCOES: { value: string; label: string }[] = [
  { value: "TODOS", label: "Todos os status" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "REJEITADO", label: "Rejeitado" },
  { value: "EXPIRADO", label: "Expirado" },
];

export function OrcamentosList({ rows }: { rows: Row[] }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "TODOS" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.numero.toLowerCase().includes(q) ||
        r.clienteNome.toLowerCase().includes(q) ||
        r.veiculoLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, busca, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente ou veículo..."
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento encontrado"
          message={
            rows.length === 0
              ? "Crie o primeiro orçamento para começar."
              : "Ajuste os filtros para ver outros resultados."
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Número</TH>
              <TH>Cliente</TH>
              <TH>Veículo</TH>
              <TH>Validade</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtrados.map((r) => (
              <TR key={r.id} className="cursor-pointer">
                <TD className="font-semibold">
                  <Link href={`/painel/orcamentos/${r.id}`} className="hover:text-accent">
                    {r.numero}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/painel/orcamentos/${r.id}`} className="block">
                    {r.clienteNome}
                  </Link>
                </TD>
                <TD className="text-muted">{r.veiculoLabel}</TD>
                <TD className="text-muted">
                  {r.validade ? formatDateBR(r.validade) : "—"}
                </TD>
                <TD className="text-right font-semibold tabular-nums">
                  {formatBRL(r.total)}
                </TD>
                <TD>
                  <StatusBadge kind="orcamento" status={r.status} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
