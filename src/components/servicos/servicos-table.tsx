"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { CategoriaServico } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { formatBRL } from "@/lib/utils";
import { toggleAtivo, deleteServico } from "@/server/servicos";
import { ServicoFiltros } from "@/components/servicos/servico-filtros";
import { CATEGORIA_LABELS, formatTempoEstimado } from "@/components/servicos/categorias";

export interface ServicoRow {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: CategoriaServico;
  precoPadrao: number;
  tempoEstimadoMin: number | null;
  ativo: boolean;
  /** Vínculos que impedem a exclusão (Restrict no servidor). */
  osItems: number;
  quoteItems: number;
}

const PAGE_SIZE = 20;

function compare(a: ServicoRow, b: ServicoRow, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return a.nome.localeCompare(b.nome, "pt-BR") * dir;
    case "categoria":
      return (
        CATEGORIA_LABELS[a.categoria].localeCompare(
          CATEGORIA_LABELS[b.categoria],
          "pt-BR"
        ) * dir
      );
    case "preco":
      return (a.precoPadrao - b.precoPadrao) * dir;
    case "tempo":
      return ((a.tempoEstimadoMin ?? -1) - (b.tempoEstimadoMin ?? -1)) * dir;
    case "situacao":
      return (Number(a.ativo) - Number(b.ativo)) * dir;
    default:
      return 0;
  }
}

export function ServicosTable({
  servicos,
  temFiltro,
}: {
  /** Já filtrados no servidor por `?q=`/`categoria`/`ativo`. */
  servicos: ServicoRow[];
  /** Há algum filtro ativo (controla o estado vazio). */
  temFiltro: boolean;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState | null>({ key: "nome", dir: "asc" });
  const [page, setPage] = useState(1);

  const [alvoExcluir, setAlvoExcluir] = useState<ServicoRow | null>(null);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);
  const [delPending, startDelTransition] = useTransition();
  const [, startToggleTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return servicos;
    return [...servicos].sort((a, b) => compare(a, b, sort));
  }, [servicos, sort]);

  const pageRows = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  );

  function handleSort(next: SortState) {
    setSort(next);
    setPage(1);
  }

  function handleToggle(s: ServicoRow) {
    startToggleTransition(async () => {
      const res = await toggleAtivo(s.id);
      if (res.ok) {
        toast({
          title: res.message ?? (s.ativo ? "Serviço desativado." : "Serviço ativado."),
          variant: "success",
        });
        router.refresh();
        return;
      }
      toast({
        title: res.message ?? "Não foi possível alterar a situação do serviço.",
        variant: "error",
      });
    });
  }

  function confirmarExclusao() {
    if (!alvoExcluir) return;
    setErroExcluir(null);
    startDelTransition(async () => {
      const res = await deleteServico(alvoExcluir.id);
      if (res.ok) {
        toast({
          title: res.message ?? "Serviço excluído com sucesso.",
          variant: "success",
        });
        setAlvoExcluir(null);
        router.refresh();
        return;
      }
      setErroExcluir(res.message ?? "Não foi possível excluir o serviço.");
    });
  }

  const columns: Column<ServicoRow>[] = [
    {
      key: "nome",
      header: "Nome",
      sortable: true,
      render: (s) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground">{s.nome}</div>
          {s.descricao && (
            <div className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted">
              {s.descricao}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "categoria",
      header: "Categoria",
      sortable: true,
      render: (s) => <Badge variant="outline">{CATEGORIA_LABELS[s.categoria]}</Badge>,
    },
    {
      key: "preco",
      header: "Preço padrão",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className="font-semibold tabular-nums">{formatBRL(s.precoPadrao)}</span>
      ),
    },
    {
      key: "tempo",
      header: "Tempo estimado",
      sortable: true,
      render: (s) => (
        <span className="text-muted">{formatTempoEstimado(s.tempoEstimadoMin)}</span>
      ),
    },
    {
      key: "situacao",
      header: "Situação",
      sortable: true,
      render: (s) => (
        <StatusBadge kind="servico" status={s.ativo ? "ATIVO" : "INATIVO"} />
      ),
    },
  ];

  function actions(s: ServicoRow): MenuItem[] {
    const ToggleIcon: LucideIcon = s.ativo ? PowerOff : Power;
    return [
      { label: "Editar", icon: Pencil, href: `/painel/servicos/${s.id}/editar` },
      {
        label: s.ativo ? "Desativar" : "Ativar",
        icon: ToggleIcon,
        onClick: () => handleToggle(s),
      },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => {
          setErroExcluir(null);
          setAlvoExcluir(s);
        },
      },
    ];
  }

  const bloqueado =
    !!alvoExcluir && (alvoExcluir.osItems > 0 || alvoExcluir.quoteItems > 0);

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        rowKey={(s) => s.id}
        caption="Catálogo de serviços da oficina"
        sort={sort}
        onSort={handleSort}
        rowActions={actions}
        emptyIcon={Wrench}
        emptyTitle={
          temFiltro ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"
        }
        emptyMessage={
          temFiltro
            ? "Ajuste os filtros ou a busca para ver outros serviços."
            : "Cadastre o primeiro serviço do catálogo para começar."
        }
        emptyAction={
          !temFiltro ? (
            <Button size="sm" onClick={() => router.push("/painel/servicos/novo")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo serviço
            </Button>
          ) : undefined
        }
        resultCount={sorted.length}
        page={page}
        pageSize={PAGE_SIZE}
        total={sorted.length}
        onPage={setPage}
        toolbar={<ServicoFiltros />}
        mobileCard={(s) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{s.nome}</p>
              {s.descricao && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.descricao}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge variant="outline">{CATEGORIA_LABELS[s.categoria]}</Badge>
                <StatusBadge kind="servico" status={s.ativo ? "ATIVO" : "INATIVO"} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="font-semibold tabular-nums text-foreground">
                  {formatBRL(s.precoPadrao)}
                </span>
                <span>{formatTempoEstimado(s.tempoEstimadoMin)}</span>
              </div>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!alvoExcluir}
        title="Excluir serviço"
        recordName={alvoExcluir ? alvoExcluir.nome : undefined}
        description={
          bloqueado
            ? "Serviços vinculados a ordens de serviço ou orçamentos não podem ser excluídos. Desative o serviço em vez de excluí-lo."
            : "Esta ação não pode ser desfeita."
        }
        consequenceItems={
          bloqueado
            ? [
                ...(alvoExcluir!.osItems > 0
                  ? [
                      `${alvoExcluir!.osItems} item${alvoExcluir!.osItems > 1 ? "ns" : ""} em ordens de serviço (impede a exclusão)`,
                    ]
                  : []),
                ...(alvoExcluir!.quoteItems > 0
                  ? [
                      `${alvoExcluir!.quoteItems} item${alvoExcluir!.quoteItems > 1 ? "ns" : ""} em orçamentos (impede a exclusão)`,
                    ]
                  : []),
              ]
            : undefined
        }
        confirmLabel={delPending ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={delPending}
        onConfirm={confirmarExclusao}
        onCancel={() => setAlvoExcluir(null)}
      />
      {erroExcluir && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {erroExcluir}
        </p>
      )}
    </>
  );
}
