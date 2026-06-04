"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Pencil, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatBRL, formatNumber } from "@/lib/utils";
import { DeletePecaButton } from "./delete-peca-button";

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
  pecas: PecaRow[];
  categorias: string[];
}

export function PecasList({ pecas, categorias }: PecasListProps) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pecas.filter((p) => {
      const matchTermo =
        termo.length === 0 ||
        p.nome.toLowerCase().includes(termo) ||
        p.codigoInterno.toLowerCase().includes(termo);
      const matchCat = categoria.length === 0 || (p.categoria ?? "") === categoria;
      return matchTermo && matchCat;
    });
  }, [pecas, busca, categoria]);

  if (pecas.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhuma peça cadastrada"
        message="Cadastre peças para controlar preços, estoque e movimentações."
        action={
          <Link href="/painel/estoque/novo">
            <Button size="sm">Cadastrar peça</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
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
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma peça encontrada"
          message="Ajuste a busca ou o filtro de categoria."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Peça</TH>
              <TH>Categoria</TH>
              <TH>Fornecedor</TH>
              <TH className="text-right">Custo</TH>
              <TH className="text-right">Venda</TH>
              <TH className="text-right">Estoque</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {filtradas.map((p) => {
              const baixo = p.quantidade <= p.estoqueMinimo;
              return (
                <TR key={p.id}>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{p.nome}</span>
                      <span className="text-xs text-muted">
                        {p.codigoInterno}
                        {p.localizacao ? ` · ${p.localizacao}` : ""}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    {p.categoria ? (
                      <Badge variant="outline">{p.categoria}</Badge>
                    ) : (
                      <span className="text-xs text-subtle">—</span>
                    )}
                  </TD>
                  <TD>
                    <span className="text-sm">
                      {p.fornecedorNome ?? (
                        <span className="text-subtle">—</span>
                      )}
                    </span>
                  </TD>
                  <TD className="text-right tabular-nums">{formatBRL(p.precoCusto)}</TD>
                  <TD className="text-right tabular-nums font-medium">
                    {formatBRL(p.precoVenda)}
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="tabular-nums font-semibold">
                        {formatNumber(p.quantidade)}
                      </span>
                      {baixo ? (
                        <Badge variant="danger">
                          <AlertTriangle className="h-3 w-3" />
                          Baixo
                        </Badge>
                      ) : null}
                    </div>
                    <span className="block text-[11px] text-muted">
                      mín. {formatNumber(p.estoqueMinimo)}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/painel/estoque/${p.id}/editar`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${p.nome}`}
                          title="Editar peça"
                          className="text-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeletePecaButton id={p.id} nome={p.nome} />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
