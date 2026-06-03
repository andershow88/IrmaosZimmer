"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";
import { formatDateBR } from "@/lib/utils";

export type InspecaoRow = {
  id: string;
  data: string; // ISO
  veiculo: string;
  placa: string;
  cliente: string;
  osNumero: string | null;
  mecanico: string | null;
  totalItens: number;
  criticos: number;
  atencao: number;
};

export interface ListaInspecoesProps {
  inspecoes: InspecaoRow[];
}

type Filtro = "TODAS" | "COM_CRITICOS" | "SEM_CRITICOS";

export function ListaInspecoes({ inspecoes }: ListaInspecoesProps) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return inspecoes.filter((i) => {
      if (filtro === "COM_CRITICOS" && i.criticos === 0) return false;
      if (filtro === "SEM_CRITICOS" && i.criticos > 0) return false;
      if (!termo) return true;
      return (
        i.veiculo.toLowerCase().includes(termo) ||
        i.placa.toLowerCase().includes(termo) ||
        i.cliente.toLowerCase().includes(termo) ||
        (i.osNumero?.toLowerCase().includes(termo) ?? false) ||
        (i.mecanico?.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [inspecoes, busca, filtro]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-9"
            placeholder="Buscar por veículo, placa, cliente, OS ou mecânico..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
            <option value="TODAS">Todas as inspeções</option>
            <option value="COM_CRITICOS">Com itens críticos</option>
            <option value="SEM_CRITICOS">Sem itens críticos</option>
          </Select>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma inspeção encontrada"
          message={
            inspecoes.length === 0
              ? "Crie a primeira inspeção digital para começar."
              : "Ajuste a busca ou os filtros."
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Veículo</TH>
              <TH>Cliente</TH>
              <TH>Data</TH>
              <TH>OS</TH>
              <TH>Mecânico</TH>
              <TH className="text-center">Itens</TH>
              <TH className="text-center">Críticos</TH>
            </TR>
          </THead>
          <TBody>
            {filtradas.map((i) => (
              <TR
                key={i.id}
                className="cursor-pointer"
              >
                <TD className="font-medium">
                  <Link href={`/checklists/${i.id}`} className="block hover:text-accent">
                    {i.veiculo}
                    <span className="ml-2 text-xs font-normal text-muted">{i.placa}</span>
                  </Link>
                </TD>
                <TD className="text-sm text-muted">
                  <Link href={`/checklists/${i.id}`} className="block">
                    {i.cliente}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap text-sm">
                  <Link href={`/checklists/${i.id}`} className="block">
                    {formatDateBR(i.data)}
                  </Link>
                </TD>
                <TD className="text-sm">
                  <Link href={`/checklists/${i.id}`} className="block">
                    {i.osNumero ? `OS ${i.osNumero}` : <span className="text-subtle">—</span>}
                  </Link>
                </TD>
                <TD className="text-sm text-muted">
                  <Link href={`/checklists/${i.id}`} className="block">
                    {i.mecanico ?? <span className="text-subtle">—</span>}
                  </Link>
                </TD>
                <TD className="text-center tabular-nums">
                  <Link href={`/checklists/${i.id}`} className="block">
                    {i.totalItens}
                  </Link>
                </TD>
                <TD className="text-center">
                  <Link href={`/checklists/${i.id}`} className="flex items-center justify-center">
                    {i.criticos > 0 ? (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {i.criticos}
                      </Badge>
                    ) : i.atencao > 0 ? (
                      <Badge variant="warning">{i.atencao} atenção</Badge>
                    ) : (
                      <Badge variant="success">0</Badge>
                    )}
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
