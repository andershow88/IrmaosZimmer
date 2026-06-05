"use client";

import {
  User as UserIcon,
  Car,
  Gauge,
  Wrench,
  Calendar,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";

export type OSHeaderData = {
  numero: string;
  status: string;
  cliente: string;
  veiculo: string;
  placa: string;
  km: number | null;
  mecanico: string | null;
  previsaoEntrega: Date | null;
  total: number;
  pagamentoStatus: string | null;
};

/** Item de informação compacto do header. */
function Info({
  icon: Icon,
  children,
}: {
  icon: typeof UserIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate text-foreground">{children}</span>
    </span>
  );
}

/**
 * Header sticky compacto da OS. Mostra o contexto essencial e a próxima ação
 * primária do status atual. `onProximaAcao` apenas dispara a UI de mudança de
 * status (a transição em si é tratada pela StatusActions).
 */
export function OSHeader({
  data,
  proximaAcaoLabel,
  onProximaAcao,
}: {
  data: OSHeaderData;
  proximaAcaoLabel: string | null;
  onProximaAcao?: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-bg/80 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">OS {data.numero}</h1>
            <StatusBadge kind="os" status={data.status} />
            {data.pagamentoStatus && (
              <StatusBadge kind="pagamento" status={data.pagamentoStatus} />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Info icon={UserIcon}>{data.cliente}</Info>
            <Info icon={Car}>
              {data.veiculo} · {data.placa}
            </Info>
            <Info icon={Gauge}>
              {data.km != null ? `${data.km.toLocaleString("pt-BR")} km` : "km —"}
            </Info>
            <Info icon={Wrench}>{data.mecanico ?? "Sem mecânico"}</Info>
            {data.previsaoEntrega && (
              <Info icon={Calendar}>
                Previsão: {formatDateTimeBR(data.previsaoEntrega)}
              </Info>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-xs text-muted">
              <Wallet className="h-3 w-3" /> Total
            </p>
            <p className="text-lg font-bold tabular-nums text-accent">
              {formatBRL(data.total)}
            </p>
          </div>
          {proximaAcaoLabel && onProximaAcao && (
            <Button size="sm" variant="primary" onClick={onProximaAcao}>
              {proximaAcaoLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
