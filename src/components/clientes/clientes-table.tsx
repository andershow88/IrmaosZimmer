"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Car,
  MapPin,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column, type SortState } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { useListControls } from "@/lib/use-list-controls";
import { deleteCliente } from "@/server/clientes";

export interface ClienteRow {
  id: string;
  nome: string;
  tipoPessoa: "FISICA" | "JURIDICA";
  cpfCnpj: string | null;
  contato: string | null;
  cidade: string | null;
  estado: string | null;
  veiculos: number;
  /** Vínculos que impedem a exclusão (Restrict no schema). */
  ordensServico: number;
  orcamentos: number;
}

function compare(a: ClienteRow, b: ClienteRow, sort: SortState): number {
  const dir = sort.dir === "asc" ? 1 : -1;
  switch (sort.key) {
    case "nome":
      return a.nome.localeCompare(b.nome, "pt-BR") * dir;
    case "tipo":
      return a.tipoPessoa.localeCompare(b.tipoPessoa) * dir;
    case "cidade":
      return (a.cidade ?? "").localeCompare(b.cidade ?? "", "pt-BR") * dir;
    case "veiculos":
      return (a.veiculos - b.veiculos) * dir;
    default:
      return 0;
  }
}

export function ClientesTable({
  clientes,
  initialQuery,
}: {
  /** Já filtrados no servidor pelo termo `?q=` (busca unificada). */
  clientes: ClienteRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { query, onQueryChange, page, setPage, pageSize, pending: navPending } =
    useListControls(initialQuery);
  const [sort, setSort] = useState<SortState | null>({ key: "nome", dir: "asc" });
  const [alvo, setAlvo] = useState<ClienteRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [delPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    if (!sort) return clientes;
    return [...clientes].sort((a, b) => compare(a, b, sort));
  }, [clientes, sort]);

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
      const result = await deleteCliente(alvo.id);
      if (result.ok) {
        toast({ title: "Cliente excluído", variant: "success" });
        setAlvo(null);
        router.refresh();
        return;
      }
      setErro(result.error);
    });
  }

  const columns: Column<ClienteRow>[] = [
    {
      key: "nome",
      header: "Nome",
      sortable: true,
      render: (c) => <span className="font-semibold text-foreground">{c.nome}</span>,
    },
    {
      key: "tipo",
      header: "Tipo",
      sortable: true,
      render: (c) => (
        <Badge variant={c.tipoPessoa === "JURIDICA" ? "info" : "default"}>
          {c.tipoPessoa === "JURIDICA" ? "Jurídica" : "Física"}
        </Badge>
      ),
    },
    {
      key: "cpfCnpj",
      header: "CPF / CNPJ",
      render: (c) => <span className="text-muted">{c.cpfCnpj || "—"}</span>,
    },
    {
      key: "contato",
      header: "Contato",
      render: (c) => <span className="text-muted">{c.contato || "—"}</span>,
    },
    {
      key: "cidade",
      header: "Cidade",
      sortable: true,
      render: (c) =>
        c.cidade ? (
          <span className="inline-flex items-center gap-1 text-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {c.cidade}
            {c.estado ? `/${c.estado}` : ""}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "veiculos",
      header: "Veículos",
      sortable: true,
      align: "center",
      render: (c) => (
        <span className="inline-flex items-center gap-1 text-muted">
          <Car className="h-3.5 w-3.5" aria-hidden="true" />
          {c.veiculos}
        </span>
      ),
    },
  ];

  function actions(c: ClienteRow): MenuItem[] {
    return [
      { label: "Ver detalhes", icon: Eye, href: `/painel/clientes/${c.id}` },
      { label: "Editar", icon: Pencil, href: `/painel/clientes/${c.id}/editar` },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => {
          setErro(null);
          setAlvo(c);
        },
      },
    ];
  }

  const bloqueado = !!alvo && (alvo.ordensServico > 0 || alvo.orcamentos > 0);

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        rowKey={(c) => c.id}
        caption="Lista de clientes cadastrados"
        loading={navPending}
        sort={sort}
        onSort={handleSort}
        rowActions={actions}
        onRowClick={(c) => router.push(`/painel/clientes/${c.id}`)}
        emptyIcon={Users}
        emptyTitle={
          query ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"
        }
        emptyMessage={
          query
            ? "Tente ajustar os termos da busca."
            : "Cadastre o primeiro cliente para começar."
        }
        emptyAction={
          !query ? (
            <Button
              size="sm"
              onClick={() => router.push("/painel/clientes/novo")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo cliente
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
            placeholder="Buscar por nome, CPF/CNPJ, telefone ou cidade…"
            aria-label="Buscar clientes"
            className="max-w-md"
          />
        }
        mobileCard={(c) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{c.nome}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {c.cpfCnpj || "Sem documento"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge variant={c.tipoPessoa === "JURIDICA" ? "info" : "default"}>
                  {c.tipoPessoa === "JURIDICA" ? "Jurídica" : "Física"}
                </Badge>
                {c.cidade && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {c.cidade}
                    {c.estado ? `/${c.estado}` : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Car className="h-3 w-3" aria-hidden="true" />
                  {c.veiculos}
                </span>
              </div>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!alvo}
        title="Excluir cliente"
        recordName={alvo ? `Cliente ${alvo.nome}` : undefined}
        description={
          bloqueado
            ? "Clientes com ordens de serviço ou orçamentos vinculados não podem ser excluídos. Cancele ou transfira esses registros antes de tentar novamente."
            : "Esta ação remove também os veículos e agendamentos vinculados e não pode ser desfeita."
        }
        consequenceItems={
          bloqueado
            ? [
                ...(alvo!.ordensServico > 0
                  ? [
                      `${alvo!.ordensServico} ordem${alvo!.ordensServico > 1 ? "ns" : ""} de serviço (impede a exclusão)`,
                    ]
                  : []),
                ...(alvo!.orcamentos > 0
                  ? [
                      `${alvo!.orcamentos} orçamento${alvo!.orcamentos > 1 ? "s" : ""} (impede a exclusão)`,
                    ]
                  : []),
              ]
            : alvo && alvo.veiculos > 0
              ? [
                  `${alvo.veiculos} veículo${alvo.veiculos > 1 ? "s" : ""} vinculado${
                    alvo.veiculos > 1 ? "s" : ""
                  }`,
                ]
              : undefined
        }
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
