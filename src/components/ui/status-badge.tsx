import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Domínios de status suportados. */
export type StatusKind =
  | "os"
  | "orcamento"
  | "agendamento"
  | "pagamento"
  | "inspecao";

type StatusEntry = { label: string; variant: BadgeVariant };

const STATUS_OS: Record<string, StatusEntry> = {
  ABERTA: { label: "Aberta", variant: "info" },
  AGUARDANDO_DIAGNOSTICO: { label: "Aguardando diagnóstico", variant: "warning" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", variant: "warning" },
  APROVADA: { label: "Aprovada", variant: "accent" },
  EM_EXECUCAO: { label: "Em execução", variant: "accent" },
  AGUARDANDO_PECAS: { label: "Aguardando peças", variant: "warning" },
  CONCLUIDA: { label: "Concluída", variant: "success" },
  ENTREGUE: { label: "Entregue", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
};

const STATUS_ORCAMENTO: Record<string, StatusEntry> = {
  RASCUNHO: { label: "Rascunho", variant: "outline" },
  ENVIADO: { label: "Enviado", variant: "info" },
  APROVADO: { label: "Aprovado", variant: "success" },
  REJEITADO: { label: "Rejeitado", variant: "danger" },
  EXPIRADO: { label: "Expirado", variant: "warning" },
};

const STATUS_AGENDAMENTO: Record<string, StatusEntry> = {
  AGENDADO: { label: "Agendado", variant: "info" },
  CONFIRMADO: { label: "Confirmado", variant: "accent" },
  VEICULO_RECEBIDO: { label: "Veículo recebido", variant: "accent" },
  NAO_COMPARECEU: { label: "Não compareceu", variant: "danger" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
  CONCLUIDO: { label: "Concluído", variant: "success" },
};

const STATUS_PAGAMENTO: Record<string, StatusEntry> = {
  PENDENTE: { label: "Pendente", variant: "warning" },
  PARCIAL: { label: "Parcial", variant: "info" },
  PAGO: { label: "Pago", variant: "success" },
  VENCIDO: { label: "Vencido", variant: "danger" },
  CANCELADO: { label: "Cancelado", variant: "outline" },
};

const STATUS_INSPECAO: Record<string, StatusEntry> = {
  OK: { label: "OK", variant: "success" },
  ATENCAO: { label: "Atenção", variant: "warning" },
  CRITICO: { label: "Crítico", variant: "danger" },
  NAO_VERIFICADO: { label: "Não verificado", variant: "outline" },
};

const MAPS: Record<StatusKind, Record<string, StatusEntry>> = {
  os: STATUS_OS,
  orcamento: STATUS_ORCAMENTO,
  agendamento: STATUS_AGENDAMENTO,
  pagamento: STATUS_PAGAMENTO,
  inspecao: STATUS_INSPECAO,
};

/** Resolve rótulo + variante de um status de domínio. */
export function resolveStatus(kind: StatusKind, status: string): StatusEntry {
  return MAPS[kind][status] ?? { label: status, variant: "default" };
}

export interface StatusBadgeProps {
  kind: StatusKind;
  status: string;
  className?: string;
}

export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const { label, variant } = resolveStatus(kind, status);
  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );
}
