"use client";

import { FileText, ExternalLink, CreditCard } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { formatBRL, formatDateBR } from "@/lib/utils";

export type OSaFaturarRow = {
  id: string;
  numero: string;
  cliente: string;
  veiculo: string;
  placa: string;
  dataAbertura: string; // ISO
  total: number;
  pago: number;
  saldo: number;
};

export function ContasAFaturarTable({ ordens }: { ordens: OSaFaturarRow[] }) {
  const columns: Column<OSaFaturarRow>[] = [
    {
      key: "numero",
      header: "OS",
      render: (os) => <span className="font-medium text-accent">{os.numero}</span>,
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (os) => <span className="text-foreground">{os.cliente}</span>,
    },
    {
      key: "veiculo",
      header: "Veículo",
      render: (os) => (
        <span>
          <span className="text-foreground">{os.veiculo}</span>
          <span className="ml-2 text-xs text-muted">{os.placa}</span>
        </span>
      ),
    },
    {
      key: "dataAbertura",
      header: "Concluída em",
      render: (os) => (
        <span className="whitespace-nowrap text-muted">
          {formatDateBR(os.dataAbertura)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (os) => <span className="tabular-nums">{formatBRL(os.total)}</span>,
    },
    {
      key: "pago",
      header: "Pago",
      align: "right",
      render: (os) => (
        <span className="tabular-nums text-muted">{formatBRL(os.pago)}</span>
      ),
    },
    {
      key: "saldo",
      header: "Saldo",
      align: "right",
      render: (os) => (
        <Badge variant={os.pago > 0 ? "warning" : "danger"}>
          {formatBRL(os.saldo)}
        </Badge>
      ),
    },
  ];

  function actions(os: OSaFaturarRow): MenuItem[] {
    return [
      {
        label: "Ver OS",
        icon: ExternalLink,
        href: `/painel/ordens-servico/${os.id}`,
      },
      {
        label: "Faturar",
        icon: CreditCard,
        href: "/painel/pagamentos/novo",
      },
    ];
  }

  return (
    <DataTable
      columns={columns}
      data={ordens}
      rowKey={(os) => os.id}
      caption="Ordens de serviço concluídas a faturar"
      showCount={false}
      rowActions={actions}
      emptyIcon={FileText}
      emptyTitle="Nenhuma OS a faturar"
      emptyMessage="Todas as ordens de serviço concluídas já estão quitadas."
      mobileCard={(os) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-accent">{os.numero}</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {os.cliente} · {os.veiculo} ({os.placa})
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              Concluída em {formatDateBR(os.dataAbertura)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <Badge variant={os.pago > 0 ? "warning" : "danger"}>
              {formatBRL(os.saldo)}
            </Badge>
            <p className="mt-1 text-xs text-muted tabular-nums">
              de {formatBRL(os.total)}
            </p>
          </div>
        </div>
      )}
    />
  );
}
