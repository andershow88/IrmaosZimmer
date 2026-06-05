import { BellRing } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "@/lib/utils";
import type { RevisaoAVencer } from "@/server/dashboard";

function prazo(dias: number): { texto: string; variant: "danger" | "warning" | "info" } {
  if (dias < 0) return { texto: "vencida", variant: "danger" };
  if (dias === 0) return { texto: "hoje", variant: "warning" };
  if (dias <= 7) return { texto: `em ${dias} dias`, variant: "warning" };
  return { texto: `em ${dias} dias`, variant: "info" };
}

export function RevisoesList({ itens }: { itens: RevisaoAVencer[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="Nenhuma revisão a vencer"
        message="Sem revisões pendentes nos próximos 30 dias."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((r) => {
        const p = prazo(r.diasParaVencer);
        return (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {r.clienteNome}
              </p>
              <p className="text-xs text-muted">{formatDateBR(r.dueDate)}</p>
            </div>
            <Badge variant={p.variant} className="shrink-0">
              {p.texto}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
