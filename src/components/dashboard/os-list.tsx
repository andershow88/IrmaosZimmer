import Link from "next/link";
import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "@/lib/utils";
import type { OSResumo } from "@/server/dashboard";

/** Rótulo legível para os dias até/desde a previsão de entrega. */
function prazoLabel(dias: number): { texto: string; variant: "danger" | "warning" | "success" } {
  if (dias < 0) {
    const d = Math.abs(dias);
    return { texto: d === 1 ? "1 dia atrasada" : `${d} dias atrasada`, variant: "danger" };
  }
  if (dias === 0) return { texto: "entrega hoje", variant: "warning" };
  if (dias === 1) return { texto: "amanhã", variant: "warning" };
  return { texto: `em ${dias} dias`, variant: "success" };
}

export interface OSListProps {
  itens: OSResumo[];
  emptyTitle: string;
  emptyMessage?: string;
  /** Exibe o badge de prazo (dias até/desde previsão). */
  mostrarPrazo?: boolean;
  /** Exibe o status da OS. */
  mostrarStatus?: boolean;
}

export function OSList({
  itens,
  emptyTitle,
  emptyMessage,
  mostrarPrazo = true,
  mostrarStatus = false,
}: OSListProps) {
  if (itens.length === 0) {
    return <EmptyState icon={Wrench} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((os) => {
        const prazo =
          mostrarPrazo && os.diasParaPrevisao != null
            ? prazoLabel(os.diasParaPrevisao)
            : null;
        return (
          <li key={os.id} className="py-2.5 first:pt-0 last:pb-0">
            <Link
              href={`/painel/ordens-servico/${os.id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-1 -mx-1 transition hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-accent">{os.numero}</span>
                  <span className="truncate font-medium text-foreground">
                    {os.clienteNome}
                  </span>
                </p>
                <p className="truncate text-xs text-muted">
                  {os.veiculo}
                  <span className="ml-1 uppercase">{os.placa}</span>
                  {os.previsaoEntrega && (
                    <span className="ml-1">· {formatDateBR(os.previsaoEntrega)}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {mostrarStatus && <StatusBadge kind="os" status={os.status} />}
                {prazo && <Badge variant={prazo.variant}>{prazo.texto}</Badge>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
