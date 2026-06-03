"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { COMBUSTIVEL_LABELS } from "@/components/veiculos/constants";
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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function VeiculosList({ veiculos }: { veiculos: VeiculoListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return veiculos;
    return veiculos.filter((v) => {
      const haystack = normalize(
        `${v.placa} ${v.marca} ${v.modelo} ${v.clienteNome}`
      );
      return haystack.includes(q);
    });
  }, [veiculos, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por placa, marca, modelo ou cliente..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title={
            query
              ? "Nenhum veículo encontrado"
              : "Nenhum veículo cadastrado"
          }
          message={
            query
              ? "Tente ajustar os termos da busca."
              : "Cadastre o primeiro veículo para começar."
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Placa</TH>
              <TH>Veículo</TH>
              <TH>Proprietário</TH>
              <TH>Combustível</TH>
              <TH className="text-right">OS</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((v) => (
              <TR key={v.id} className="cursor-pointer">
                <TD className="font-semibold">
                  <Link
                    href={`/veiculos/${v.id}`}
                    className="font-mono tracking-wide text-foreground hover:text-accent"
                  >
                    {v.placa}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/veiculos/${v.id}`} className="block">
                    <span className="font-medium text-foreground">
                      {v.marca} {v.modelo}
                    </span>
                    <span className="block text-xs text-muted">
                      {[v.ano, v.cor].filter(Boolean).join(" • ") || "—"}
                    </span>
                  </Link>
                </TD>
                <TD>
                  <span className="text-foreground">{v.clienteNome}</span>
                </TD>
                <TD>
                  {v.combustivel ? (
                    <Badge variant="outline">
                      {COMBUSTIVEL_LABELS[v.combustivel]}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </TD>
                <TD className="text-right tabular-nums">{v.totalOS}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
