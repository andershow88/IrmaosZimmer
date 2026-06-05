import {
  CirclePlus,
  ArrowRightLeft,
  Package,
  CreditCard,
  Timer,
  FileEdit,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeBR } from "@/lib/utils";
import type { TimelineEvent, TimelineEventKind } from "@/server/ordens";

const ICONS: Record<TimelineEventKind, LucideIcon> = {
  criacao: CirclePlus,
  status: ArrowRightLeft,
  item_add: Package,
  item_remove: Package,
  pagamento: CreditCard,
  horas: Timer,
  auditoria: FileEdit,
};

const TONES: Record<TimelineEventKind, string> = {
  criacao: "bg-accent-soft text-accent",
  status: "bg-info/10 text-info",
  item_add: "bg-success/10 text-success",
  item_remove: "bg-danger/10 text-danger",
  pagamento: "bg-success/10 text-success",
  horas: "bg-warning/10 text-warning",
  auditoria: "bg-surface text-muted",
};

/**
 * Timeline cronológica (Server Component). Recebe os eventos já ordenados
 * (do mais recente para o mais antigo) vindos de `getOSTimeline`.
 */
export function OSTimeline({ eventos }: { eventos: TimelineEvent[] }) {
  if (eventos.length === 0) {
    return (
      <EmptyState
        icon={FileEdit}
        title="Sem atividades registradas"
        message="As ações realizadas nesta OS aparecerão aqui em ordem cronológica."
      />
    );
  }

  return (
    <ol className="relative ml-2 border-l border-border">
      {eventos.map((e) => {
        const Icon = ICONS[e.kind] ?? FileEdit;
        return (
          <li key={e.id} className="relative pb-6 pl-8 last:pb-0">
            <span
              className={
                "absolute -left-[13px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-bg " +
                (TONES[e.kind] ?? "bg-surface text-muted")
              }
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">{e.titulo}</p>
              {e.detalhe && (
                <p className="text-xs text-muted">{e.detalhe}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtle">
                <time dateTime={e.data.toISOString()}>
                  {formatDateTimeBR(e.data)}
                </time>
                {e.usuario && (
                  <span className="inline-flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {e.usuario}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
