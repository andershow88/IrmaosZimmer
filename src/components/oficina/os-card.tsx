import Link from "next/link";
import { Car, User as UserIcon, ChevronRight, Play } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrioridadeBadge } from "@/components/ordens/prioridade-badge";
import type { OficinaCard } from "@/server/oficina";

/**
 * Cartão grande (touch-first, alvo >= 44px) de uma OS atribuída ao mecânico.
 * Mostra veículo+placa, cliente, queixa e status. Link para o detalhe enxuto.
 */
export function OSCard({ os }: { os: OficinaCard }) {
  return (
    <Link
      href={`/painel/oficina/${os.id}`}
      className="group block rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm transition hover:border-accent/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <Car className="h-5 w-5 shrink-0 text-accent" />
            <span className="truncate">{os.veiculo}</span>
          </div>
          <p className="mt-0.5 font-mono text-sm font-semibold uppercase tracking-wide text-muted">
            {os.placa}
          </p>
        </div>
        <ChevronRight className="mt-1 h-6 w-6 shrink-0 text-subtle transition group-hover:text-accent" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        <UserIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{os.cliente}</span>
      </div>

      {os.queixa && (
        <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{os.queixa}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge kind="os" status={os.status} />
        <PrioridadeBadge prioridade={os.prioridade} />
        <span className="ml-auto font-mono text-xs text-subtle">{os.numero}</span>
      </div>

      {os.emExecucaoPorMim && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
          <Play className="h-4 w-4 fill-current" />
          Cronômetro em andamento
        </div>
      )}
    </Link>
  );
}
