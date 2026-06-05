import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeBR } from "@/lib/utils";
import type { AtividadeItem } from "@/server/dashboard";

export function AtividadeList({ itens }: { itens: AtividadeItem[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem atividade recente"
        message="As ações registradas no sistema aparecerão aqui."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {itens.map((a) => (
        <li key={a.id} className="flex gap-3">
          <span
            aria-hidden
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
          />
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">{a.acao}</span>
              <span className="text-muted"> · {a.entidade}</span>
            </p>
            {a.detalhe && (
              <p className="truncate text-xs text-muted">{a.detalhe}</p>
            )}
            <p className="text-xs text-subtle">
              {a.usuario ? `${a.usuario} · ` : ""}
              {formatDateTimeBR(a.quando)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
