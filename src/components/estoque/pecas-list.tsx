"use client";

import { useMemo, useState, useTransition } from "react";
import {
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { Package, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { StatusBadge, nivelEstoque } from "@/components/ui/status-badge";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { useListControls } from "@/lib/use-list-controls";
import { formatBRL, formatNumber } from "@/lib/utils";
import { deletePeca } from "@/server/estoque";

export interface PecaRow {
  id: string;
  nome: string;
  codigoInterno: string;
  categoria: string | null;
  fornecedorNome: string | null;
  precoCusto: number;
  precoVenda: number;
  quantidade: number;
  estoqueMinimo: number;
  localizacao: string | null;
}

interface PecasListProps {
  /** Já filtradas no servidor por `?q=` (nome/código/categoria) e `?categoria=`. */
  pecas: PecaRow[];
  categorias: string[];
  initialQuery: string;
  initialCategoria: string;
}

function compare(a: PecaRow, b: PecaRow, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return a.nome.localeCompare(b.nome, "pt-BR") * dir;
    case "categoria":
      return (a.categoria ?? "").localeCompare(b.categoria ?? "", "pt-BR") * dir;
    case "precoCusto":
      return (a.precoCusto - b.precoCusto) * dir;
    case "precoVenda":
      return (a.precoVenda - b.precoVenda) * dir;
    case "estoque":
      return (a.quantidade - b.quantidade) * dir;
    default:
      return 0;
  }
}

export function PecasList({
  pecas,
  categorias,
  initialQuery,
  initialCategoria,
}: PecasListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query, onQueryChange, page, setPage, pageSize, pending: navPending } =
    useListControls(initialQuery);
  const [sort, setSort] = useState<SortState | null>({ key: "nome", dir: "asc" });
  const [alvo, setAlvo] = useState<PecaRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [delPending, startTransition] = useTransition();
  const [catPending, startCatTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return pecas;
    return [...pecas].sort((a, b) => compare(a, b, sort));
  }, [pecas, sort]);

  const pageRows = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  function handleSort(next: SortState) {
    setSort(next);
    setPage(1);
  }

  function handleCategoria(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("categoria", value);
    else params.delete("categoria");
    const qs = params.toString();
    startCatTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function confirmarExclusao() {
    if (!alvo) return;
    setErro(null);
    startTransition(async () => {
      const result = await deletePeca(alvo.id);
      if (result.ok) {
        toast({ title: "Peça excluída", variant: "success" });
        setAlvo(null);
        router.refresh();
        return;
      }
      setErro(result.error);
      toast({
        title: "Não foi possível excluir a peça",
        description: result.error,
        variant: "error",
      });
    });
  }

  const columns: Column<PecaRow>[] = [
    {
      key: "nome",
      header: "Peça",
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{p.nome}</span>
          <span className="text-xs text-muted">
            {p.codigoInterno}
            {p.localizacao ? ` · ${p.localizacao}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Categoria",
      sortable: true,
      render: (p) =>
        p.categoria ? (
          <Badge variant="outline">{p.categoria}</Badge>
        ) : (
          <span className="text-xs text-subtle">—</span>
        ),
    },
    {
      key: "fornecedor",
      header: "Fornecedor",
      render: (p) => (
        <span className="text-sm">
          {p.fornecedorNome ?? <span className="text-subtle">—</span>}
        </span>
      ),
    },
    {
      key: "precoCusto",
      header: "Custo",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="tabular-nums">{formatBRL(p.precoCusto)}</span>
      ),
    },
    {
      key: "precoVenda",
      header: "Venda",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="tabular-nums font-medium">{formatBRL(p.precoVenda)}</span>
      ),
    },
    {
      key: "estoque",
      header: "Estoque",
      sortable: true,
      align: "right",
      render: (p) => {
        const baixo = p.quantidade <= p.estoqueMinimo;
        return (
          <div className="flex flex-col items-end">
            <div className="flex items-center justify-end gap-2">
              <span className="tabular-nums font-semibold">
                {formatNumber(p.quantidade)}
              </span>
              {baixo && (
                <StatusBadge
                  kind="estoque"
                  status={nivelEstoque(p.quantidade, p.estoqueMinimo)}
                />
              )}
            </div>
            <span className="text-[11px] text-muted">
              mín. {formatNumber(p.estoqueMinimo)}
            </span>
          </div>
        );
      },
    },
  ];

  function actions(p: PecaRow): MenuItem[] {
    return [
      { label: "Editar", icon: Pencil, href: `/painel/estoque/${p.id}/editar` },
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

  const temFiltro = !!query || !!initialCategoria;

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        rowKey={(p) => p.id}
        caption="Lista de peças cadastradas"
        loading={navPending || catPending}
        sort={sort}
        onSort={handleSort}
        rowActions={actions}
        onRowClick={(p) => router.push(`/painel/estoque/${p.id}/editar`)}
        emptyIcon={Package}
        emptyTitle={
          temFiltro ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"
        }
        emptyMessage={
          temFiltro
            ? "Ajuste a busca ou o filtro de categoria."
            : "Cadastre peças para controlar preços, estoque e movimentações."
        }
        emptyAction={
          !temFiltro ? (
            <Button size="sm" onClick={() => router.push("/painel/estoque/novo")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cadastrar peça
            </Button>
          ) : undefined
        }
        resultCount={sorted.length}
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPage={setPage}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={query}
              onChange={onQueryChange}
              debounce={300}
              placeholder="Buscar por nome, código ou categoria…"
              aria-label="Buscar peças"
              className="sm:w-72"
            />
            {categorias.length > 0 && (
              <div className="sm:w-56">
                <Select
                  value={initialCategoria}
                  onChange={(e) => handleCategoria(e.target.value)}
                  aria-label="Filtrar por categoria"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        }
        mobileCard={(p) => {
          const baixo = p.quantidade <= p.estoqueMinimo;
          return (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{p.nome}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {p.codigoInterno}
                  {p.localizacao ? ` · ${p.localizacao}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {p.categoria && <Badge variant="outline">{p.categoria}</Badge>}
                  {p.fornecedorNome && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {p.fornecedorNome}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatNumber(p.quantidade)}
                </span>
                <span className="text-[11px] text-muted">
                  mín. {formatNumber(p.estoqueMinimo)}
                </span>
                {baixo && (
                  <StatusBadge
                    kind="estoque"
                    status={nivelEstoque(p.quantidade, p.estoqueMinimo)}
                  />
                )}
                <span className="text-xs tabular-nums text-muted">
                  {formatBRL(p.precoVenda)}
                </span>
              </div>
            </div>
          );
        }}
      />

      <ConfirmDialog
        open={!!alvo}
        title="Excluir peça"
        recordName={alvo ? `Peça ${alvo.nome}` : undefined}
        description="Esta ação não pode ser desfeita. Peças vinculadas a ordens de serviço ou orçamentos não podem ser excluídas."
        consequenceItems={[
          "O cadastro da peça e seu saldo de estoque",
          "O histórico de movimentações registrado para esta peça",
        ]}
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
