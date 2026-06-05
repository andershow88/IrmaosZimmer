"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { useListControls } from "@/lib/use-list-controls";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { deletePagamento } from "@/server/pagamentos";
import { FORMA_LABELS } from "./constants";
import { PagamentosFiltros } from "./pagamentos-filtros";
import type { FormaPagamento, StatusPagamento } from "@prisma/client";

export interface PagamentoRow {
  id: string;
  numero: string;
  cliente: string;
  veiculo: string;
  placa: string | null;
  valorTotal: number;
  valorPago: number;
  saldo: number;
  forma: FormaPagamento;
  status: StatusPagamento;
  dataPagamento: string | null;
}

function compare(a: PagamentoRow, b: PagamentoRow, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "numero":
      return a.numero.localeCompare(b.numero, "pt-BR") * dir;
    case "valorTotal":
      return (a.valorTotal - b.valorTotal) * dir;
    case "valorPago":
      return (a.valorPago - b.valorPago) * dir;
    case "saldo":
      return (a.saldo - b.saldo) * dir;
    default:
      return 0;
  }
}

export function PagamentosTable({
  pagamentos,
  initialQuery,
}: {
  /** Já filtrados no servidor por `?q=`, `?status=` e `?forma=`. */
  pagamentos: PagamentoRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { query, onQueryChange, page, setPage, pageSize, pending: navPending } =
    useListControls(initialQuery);
  const [sort, setSort] = useState<SortState | null>(null);
  const [alvo, setAlvo] = useState<PagamentoRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [delPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return pagamentos;
    return [...pagamentos].sort((a, b) => compare(a, b, sort));
  }, [pagamentos, sort]);

  const pageRows = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  function handleSort(next: SortState) {
    setSort(next);
    setPage(1);
  }

  function confirmarExclusao() {
    if (!alvo) return;
    setErro(null);
    startTransition(async () => {
      const result = await deletePagamento(alvo.id);
      if (result.ok) {
        toast({ title: "Pagamento excluído", variant: "success" });
        setAlvo(null);
        router.refresh();
        return;
      }
      setErro(result.error);
    });
  }

  const columns: Column<PagamentoRow>[] = [
    {
      key: "numero",
      header: "OS / Cliente",
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold text-foreground">{p.numero}</span>
          <p className="text-xs text-muted">{p.cliente}</p>
        </div>
      ),
    },
    {
      key: "veiculo",
      header: "Veículo",
      render: (p) => (
        <div>
          <span className="text-sm">{p.veiculo}</span>
          {p.placa && <p className="text-xs text-muted">{p.placa}</p>}
        </div>
      ),
    },
    {
      key: "valorTotal",
      header: "Valor total",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="tabular-nums">{formatBRL(p.valorTotal)}</span>
      ),
    },
    {
      key: "valorPago",
      header: "Valor pago",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="tabular-nums">{formatBRL(p.valorPago)}</span>
      ),
    },
    {
      key: "saldo",
      header: "Saldo",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="font-medium tabular-nums">{formatBRL(p.saldo)}</span>
      ),
    },
    {
      key: "forma",
      header: "Forma",
      render: (p) => <span className="text-sm">{FORMA_LABELS[p.forma]}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge kind="pagamento" status={p.status} />,
    },
    {
      key: "dataPagamento",
      header: "Data",
      render: (p) => (
        <span className="text-sm text-muted">
          {p.dataPagamento ? formatDateBR(p.dataPagamento) : "—"}
        </span>
      ),
    },
  ];

  function actions(p: PagamentoRow): MenuItem[] {
    return [
      { label: "Ver detalhes", icon: Eye, href: `/painel/pagamentos/${p.id}` },
      { label: "Editar", icon: Pencil, href: `/painel/pagamentos/${p.id}/editar` },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => {
          setErro(null);
          setAlvo(p);
        },
      },
    ];
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        rowKey={(p) => p.id}
        caption="Lista de pagamentos das ordens de serviço"
        loading={navPending}
        sort={sort}
        onSort={handleSort}
        rowActions={actions}
        onRowClick={(p) => router.push(`/painel/pagamentos/${p.id}`)}
        emptyIcon={CreditCard}
        emptyTitle="Nenhum pagamento encontrado"
        emptyMessage={
          query
            ? "Tente ajustar os termos da busca ou os filtros."
            : "Ajuste os filtros ou registre um novo pagamento para uma ordem de serviço."
        }
        emptyAction={
          !query ? (
            <Button
              size="sm"
              onClick={() => router.push("/painel/pagamentos/novo")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo pagamento
            </Button>
          ) : undefined
        }
        resultCount={sorted.length}
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPage={setPage}
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <SearchInput
              value={query}
              onChange={onQueryChange}
              debounce={300}
              placeholder="Buscar por OS ou cliente…"
              aria-label="Buscar pagamentos"
              className="max-w-md"
            />
            <PagamentosFiltros />
          </div>
        }
        mobileCard={(p) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{p.numero}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{p.cliente}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {p.veiculo}
                {p.placa ? ` • ${p.placa}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <StatusBadge kind="pagamento" status={p.status} />
                <span>{FORMA_LABELS[p.forma]}</span>
                {p.dataPagamento && <span>{formatDateBR(p.dataPagamento)}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted">Saldo</p>
              <p className="font-semibold tabular-nums text-foreground">
                {formatBRL(p.saldo)}
              </p>
              <p className="mt-1 text-xs tabular-nums text-muted">
                {formatBRL(p.valorPago)} / {formatBRL(p.valorTotal)}
              </p>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!alvo}
        title="Excluir pagamento?"
        recordName={alvo ? `Pagamento da OS ${alvo.numero}` : undefined}
        description="Esta ação não pode ser desfeita. O registro de pagamento será removido permanentemente."
        confirmLabel={delPending ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={delPending}
        onConfirm={confirmarExclusao}
        onCancel={() => setAlvo(null)}
      />
      {erro && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {erro}
        </p>
      )}
    </>
  );
}
