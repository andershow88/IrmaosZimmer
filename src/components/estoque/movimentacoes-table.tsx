"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDateTimeBR, formatNumber } from "@/lib/utils";

export type TipoMovimentacao = "ENTRADA" | "SAIDA" | "AJUSTE";

export interface MovimentacaoRow {
  id: string;
  /** ISO string da data de criação. */
  createdAt: string;
  pecaNome: string;
  pecaCodigo: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string | null;
}

const PAGE_SIZE = 20;

function TipoBadge({ tipo }: { tipo: TipoMovimentacao }) {
  if (tipo === "ENTRADA") {
    return (
      <Badge variant="success">
        <ArrowDownToLine className="h-3 w-3" />
        Entrada
      </Badge>
    );
  }
  if (tipo === "SAIDA") {
    return (
      <Badge variant="danger">
        <ArrowUpFromLine className="h-3 w-3" />
        Saída
      </Badge>
    );
  }
  return (
    <Badge variant="info">
      <SlidersHorizontal className="h-3 w-3" />
      Ajuste
    </Badge>
  );
}

export function MovimentacoesTable({
  movimentacoes,
}: {
  movimentacoes: MovimentacaoRow[];
}) {
  const [page, setPage] = useState(1);

  const pageRows = useMemo(
    () => movimentacoes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [movimentacoes, page]
  );

  const columns: Column<MovimentacaoRow>[] = [
    {
      key: "createdAt",
      header: "Data",
      className: "whitespace-nowrap",
      render: (m) => (
        <span className="text-sm text-muted">
          {formatDateTimeBR(m.createdAt)}
        </span>
      ),
    },
    {
      key: "peca",
      header: "Peça",
      render: (m) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{m.pecaNome}</span>
          <span className="text-xs text-muted">{m.pecaCodigo}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (m) => <TipoBadge tipo={m.tipo} />,
    },
    {
      key: "quantidade",
      header: "Qtd.",
      align: "right",
      render: (m) => (
        <span className="tabular-nums font-semibold">
          {m.tipo === "ENTRADA" ? "+" : m.tipo === "SAIDA" ? "−" : ""}
          {formatNumber(m.quantidade)}
        </span>
      ),
    },
    {
      key: "motivo",
      header: "Motivo",
      className: "max-w-xs",
      render: (m) => (
        <span className="text-sm text-muted">{m.motivo ?? "—"}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      rowKey={(m) => m.id}
      caption="Histórico de movimentações de estoque"
      showCount={false}
      emptyIcon={ArrowLeftRight}
      emptyTitle="Nenhuma movimentação registrada"
      emptyMessage="Use o formulário ao lado para registrar a primeira movimentação."
      resultCount={movimentacoes.length}
      page={page}
      pageSize={PAGE_SIZE}
      total={movimentacoes.length}
      onPage={setPage}
      mobileCard={(m) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{m.pecaNome}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{m.pecaCodigo}</p>
            <p className="mt-1 text-xs text-muted">
              {formatDateTimeBR(m.createdAt)}
            </p>
            {m.motivo && (
              <p className="mt-1 text-xs text-muted">{m.motivo}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TipoBadge tipo={m.tipo} />
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {m.tipo === "ENTRADA" ? "+" : m.tipo === "SAIDA" ? "−" : ""}
              {formatNumber(m.quantidade)}
            </span>
          </div>
        </div>
      )}
    />
  );
}
