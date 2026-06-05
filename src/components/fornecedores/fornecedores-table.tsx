"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Package, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { useListControls } from "@/lib/use-list-controls";
import { maskCPFCNPJ } from "@/lib/masks";
import { deleteFornecedor } from "@/server/fornecedores";

/** Detecta o erro especial lançado por `redirect()` (sucesso) para re-lançá-lo. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export interface FornecedorRow {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  telefone: string | null;
  pecas: number;
}

function compare(a: FornecedorRow, b: FornecedorRow, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return a.nome.localeCompare(b.nome, "pt-BR") * dir;
    case "pecas":
      return (a.pecas - b.pecas) * dir;
    default:
      return 0;
  }
}

export function FornecedoresTable({
  fornecedores,
  initialQuery,
}: {
  /** Já filtrados no servidor pelo termo `?q=` (nome ou CNPJ). */
  fornecedores: FornecedorRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { query, onQueryChange, page, setPage, pageSize, pending: navPending } =
    useListControls(initialQuery);
  const [sort, setSort] = useState<SortState | null>({ key: "nome", dir: "asc" });
  const [alvo, setAlvo] = useState<FornecedorRow | null>(null);
  const [delPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return fornecedores;
    return [...fornecedores].sort((a, b) => compare(a, b, sort));
  }, [fornecedores, sort]);

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
    startTransition(async () => {
      try {
        await deleteFornecedor(alvo.id);
      } catch (error) {
        if (isRedirectError(error)) {
          toast({ title: "Fornecedor excluído", variant: "success" });
          throw error;
        }
        toast({
          title: "Não foi possível excluir o fornecedor",
          description:
            "Verifique se há pedidos de compra vinculados — eles impedem a exclusão.",
          variant: "error",
        });
        setAlvo(null);
      }
    });
  }

  const columns: Column<FornecedorRow>[] = [
    {
      key: "nome",
      header: "Nome",
      sortable: true,
      render: (f) => <span className="font-semibold text-foreground">{f.nome}</span>,
    },
    {
      key: "cnpj",
      header: "CNPJ",
      render: (f) => (
        <span className="text-muted">{f.cnpj ? maskCPFCNPJ(f.cnpj) : "—"}</span>
      ),
    },
    {
      key: "contato",
      header: "Contato",
      render: (f) => <span className="text-muted">{f.contato || "—"}</span>,
    },
    {
      key: "telefone",
      header: "Telefone",
      render: (f) => <span className="text-muted">{f.telefone || "—"}</span>,
    },
    {
      key: "pecas",
      header: "Peças",
      sortable: true,
      align: "right",
      render: (f) => (
        <Badge variant={f.pecas > 0 ? "accent" : "outline"}>
          <Package className="h-3 w-3" aria-hidden="true" />
          {f.pecas}
        </Badge>
      ),
    },
  ];

  function actions(f: FornecedorRow): MenuItem[] {
    return [
      { label: "Ver detalhes", icon: Eye, href: `/painel/fornecedores/${f.id}` },
      { label: "Editar", icon: Pencil, href: `/painel/fornecedores/${f.id}/editar` },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => setAlvo(f),
      },
    ];
  }

  return (
    <>
    <DataTable
      columns={columns}
      data={pageRows}
      rowKey={(f) => f.id}
      caption="Lista de fornecedores cadastrados"
      loading={navPending}
      sort={sort}
      onSort={handleSort}
      rowActions={actions}
      onRowClick={(f) => router.push(`/painel/fornecedores/${f.id}`)}
      emptyIcon={Building2}
      emptyTitle={
        query ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"
      }
      emptyMessage={
        query
          ? "Tente outro termo de busca por nome ou CNPJ."
          : "Cadastre o primeiro fornecedor para vincular às peças do estoque."
      }
      emptyAction={
        !query ? (
          <Button
            size="sm"
            onClick={() => router.push("/painel/fornecedores/novo")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo fornecedor
          </Button>
        ) : undefined
      }
      resultCount={sorted.length}
      page={page}
      pageSize={pageSize}
      total={sorted.length}
      onPage={setPage}
      toolbar={
        <SearchInput
          value={query}
          onChange={onQueryChange}
          debounce={300}
          placeholder="Buscar por nome ou CNPJ…"
          aria-label="Buscar fornecedores"
          className="max-w-md"
        />
      }
      mobileCard={(f) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{f.nome}</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {f.cnpj ? maskCPFCNPJ(f.cnpj) : "Sem CNPJ"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              {f.contato && <span className="truncate">{f.contato}</span>}
              {f.telefone && <span className="truncate">{f.telefone}</span>}
            </div>
          </div>
          <Badge variant={f.pecas > 0 ? "accent" : "outline"}>
            <Package className="h-3 w-3" aria-hidden="true" />
            {f.pecas}
          </Badge>
        </div>
      )}
    />

      <ConfirmDialog
        open={!!alvo}
        title="Excluir fornecedor?"
        recordName={alvo ? `Fornecedor ${alvo.nome}` : undefined}
        description="Esta ação não pode ser desfeita. Fornecedores com pedidos de compra vinculados não podem ser excluídos."
        consequenceItems={[
          "Pedidos de compra vinculados impedem a exclusão",
          "Peças vinculadas ficarão sem fornecedor (não são removidas)",
          "Contas a pagar vinculadas ficarão sem fornecedor (não são removidas)",
        ]}
        confirmLabel={delPending ? "Excluindo…" : "Excluir"}
        cancelLabel="Cancelar"
        variant="danger"
        loading={delPending}
        onConfirm={confirmarExclusao}
        onCancel={() => setAlvo(null)}
      />
    </>
  );
}
