import Link from "next/link";
import { ListChecks, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateBR } from "@/lib/utils";
import type { OficinaChecklist } from "@/server/oficina";

/**
 * Exibição enxuta dos checklists (inspeções) vinculados à OS.
 * Apenas leitura: a edição de itens continua no editor de checklists existente
 * (link "Abrir"). Mantém o Modo Mecânico focado, sem duplicar a tela completa.
 */
export function ChecklistView({ checklists }: { checklists: OficinaChecklist[] }) {
  if (checklists.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Sem checklist"
        message="Nenhuma inspeção vinculada a esta OS."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {checklists.map((c) => (
        <div key={c.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              Inspeção de {formatDateBR(c.data)}
            </span>
            <Link
              href={`/painel/checklists/${c.id}`}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent hover:underline"
            >
              Abrir
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {c.items.map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{it.item}</p>
                  {it.observacao && (
                    <p className="mt-0.5 text-xs text-muted">{it.observacao}</p>
                  )}
                </div>
                <StatusBadge kind="inspecao" status={it.status} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
