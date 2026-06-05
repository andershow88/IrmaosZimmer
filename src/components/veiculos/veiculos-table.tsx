"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { COMBUSTIVEL_LABELS } from "@/components/veiculos/constants";
import { useListControls } from "@/lib/use-list-controls";
import { deleteVeiculo } from "@/server/veiculos";
import type { Combustivel } from "@prisma/client";

export type VeiculoListItem = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number | null;
  cor: string | null;
  combustivel: Combustivel | null;
  clienteId: string;
  clienteNome: string;
  totalOS: number;
};

function compare(a: VeiculoListItem, b: VeiculoListItem, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "placa":
      return a.placa.localeCompare(b.placa, "pt-BR") * dir;
    case "veiculo":
      return (
        `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`, "pt-BR") *
        dir
      );
    case "cliente":
      return a.clienteNome.localeCompare(b.clienteNome, "pt-BR") * dir;
    case "os":
      return (a.totalOS - b.totalOS) * dir;
    default:
      return 0;
  }
}

export function VeiculosTable({
  veiculos,
  initialQuery,
}: {
  /** Já filtrados no servidor pelo termo `?q=` (busca unificada). */
  veiculos: VeiculoListItem[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { query, onQueryChange, page, setPage, pageSize, pending: navPending } =
    useListControls(initialQuery);
  const [sort, setSort] = useState<SortState | null>({ key: "veiculo", dir: "asc" });
  const [alvo, setAlvo] = useState<VeiculoListItem | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [delPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return veiculos;
    return [...veiculos].sort((a, b) => compare(a, b, sort));
  }, [veiculos, sort]);

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
      const result = await deleteVeiculo(alvo.id);
      if (!result.ok) {
        setErro(result.error ?? "Não foi possível excluir o veículo.");
        setAlvo(null);
        return;
      }
      toast({ title: "Veículo excluído", variant: "success" });
      setAlvo(null);
      router.refresh();
    });
  }

  const columns: Column<VeiculoListItem>[] = [
    {
      key: "placa",
      header: "Placa",
      sortable: true,
      render: (v) => (
        <span className="font-mono font-semibold tracking-wide text-foreground">
          {v.placa}
        </span>
      ),
    },
    {
      key: "veiculo",
      header: "Veículo",
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-medium text-foreground">
            {v.marca} {v.modelo}
          </span>
          <span className="block text-xs text-muted">
            {[v.ano, v.cor].filter(Boolean).join(" • ") || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "cliente",
      header: "Proprietário",
      sortable: true,
      render: (v) => <span className="text-foreground">{v.clienteNome}</span>,
    },
    {
      key: "combustivel",
      header: "Combustível",
      render: (v) =>
        v.combustivel ? (
          <Badge variant="outline">{COMBUSTIVEL_LABELS[v.combustivel]}</Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "os",
      header: "OS",
      sortable: true,
      align: "right",
      render: (v) => <span className="tabular-nums text-foreground">{v.totalOS}</span>,
    },
  ];

  function actions(v: VeiculoListItem): MenuItem[] {
    return [
      { label: "Ver detalhes", icon: Eye, href: `/painel/veiculos/${v.id}` },
      { label: "Editar", icon: Pencil, href: `/painel/veiculos/${v.id}/editar` },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => {
          setErro(null);
          setAlvo(v);
        },
      },
    ];
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        rowKey={(v) => v.id}
        caption="Lista de veículos cadastrados"
        loading={navPending}
        sort={sort}
        onSort={handleSort}
        rowActions={actions}
        onRowClick={(v) => router.push(`/painel/veiculos/${v.id}`)}
        emptyIcon={Car}
        emptyTitle={
          query ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"
        }
        emptyMessage={
          query
            ? "Tente ajustar os termos da busca."
            : "Cadastre o primeiro veículo para começar."
        }
        emptyAction={
          !query ? (
            <Button
              size="sm"
              onClick={() => router.push("/painel/veiculos/novo")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo veículo
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
            placeholder="Buscar por placa, marca, modelo ou cliente…"
            aria-label="Buscar veículos"
            className="max-w-md"
          />
        }
        mobileCard={(v) => (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {v.marca} {v.modelo}
              </span>
              <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                {v.placa}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="truncate">{v.clienteNome}</span>
              {v.combustivel && (
                <Badge variant="outline">{COMBUSTIVEL_LABELS[v.combustivel]}</Badge>
              )}
              <span>{v.totalOS} OS</span>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!alvo}
        title="Excluir veículo"
        recordName={
          alvo ? `${alvo.marca} ${alvo.modelo} — ${alvo.placa}` : undefined
        }
        description="Veículos com ordens de serviço ou orçamentos vinculados não podem ser excluídos. Esta ação não pode ser desfeita."
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
