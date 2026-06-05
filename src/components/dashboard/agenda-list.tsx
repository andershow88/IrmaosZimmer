import Link from "next/link";
import { CalendarDays, Car } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AgendaItem } from "@/server/dashboard";

export interface AgendaListProps {
  itens: AgendaItem[];
  emptyTitle: string;
  emptyMessage?: string;
  /** Ícone do estado vazio. */
  variante?: "agenda" | "recebidos";
}

export function AgendaList({
  itens,
  emptyTitle,
  emptyMessage,
  variante = "agenda",
}: AgendaListProps) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={variante === "recebidos" ? Car : CalendarDays}
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((a) => (
        <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
          <Link
            href={`/painel/agenda/${a.id}`}
            className="flex items-center justify-between gap-3 rounded-lg px-1 -mx-1 transition hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-sm font-bold tabular-nums text-accent">
                {a.hora}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {a.clienteNome}
                </p>
                <p className="truncate text-xs text-muted">
                  {a.veiculo ?? a.servicoDesejado ?? "Sem veículo"}
                </p>
              </div>
            </div>
            <StatusBadge
              kind="agendamento"
              status={a.status}
              className="shrink-0"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
