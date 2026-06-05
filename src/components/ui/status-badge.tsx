import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Domínios de status suportados. */
export type StatusKind =
  | "os"
  | "orcamento"
  | "agendamento"
  | "pagamento"
  | "inspecao"
  | "servico"
  | "estoque"
  | "conta_pagar"
  | "conta_receber";

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

const STATUS_SERVICO: Record<string, StatusEntry> = {
  ATIVO: { label: "Ativo", variant: "success" },
  INATIVO: { label: "Inativo", variant: "outline" },
};

/** Nível de estoque de uma peça (derivado de quantidade vs estoque mínimo). */
const STATUS_ESTOQUE: Record<string, StatusEntry> = {
  ZERADO: { label: "Esgotado", variant: "danger" },
  BAIXO: { label: "Estoque baixo", variant: "warning" },
  OK: { label: "Em estoque", variant: "success" },
};

/** Conta a pagar (a fornecedor): em aberto / paga / vencida. */
const STATUS_CONTA_PAGAR: Record<string, StatusEntry> = {
  EM_ABERTO: { label: "Em aberto", variant: "warning" },
  PAGO: { label: "Pago", variant: "success" },
  VENCIDO: { label: "Vencido", variant: "danger" },
};

/** Conta a receber (de cliente): em aberto / recebida / vencida. */
const STATUS_CONTA_RECEBER: Record<string, StatusEntry> = {
  EM_ABERTO: { label: "Em aberto", variant: "warning" },
  RECEBIDO: { label: "Recebido", variant: "success" },
  VENCIDO: { label: "Vencido", variant: "danger" },
};

const MAPS: Record<StatusKind, Record<string, StatusEntry>> = {
  os: STATUS_OS,
  orcamento: STATUS_ORCAMENTO,
  agendamento: STATUS_AGENDAMENTO,
  pagamento: STATUS_PAGAMENTO,
  inspecao: STATUS_INSPECAO,
  servico: STATUS_SERVICO,
  estoque: STATUS_ESTOQUE,
  conta_pagar: STATUS_CONTA_PAGAR,
  conta_receber: STATUS_CONTA_RECEBER,
};

/**
 * Deriva o nível de estoque (ZERADO/BAIXO/OK) a partir da quantidade atual e do
 * mínimo configurado — para uso direto com `<StatusBadge kind="estoque" ...>`.
 */
export function nivelEstoque(
  quantidade: number,
  estoqueMinimo: number
): "ZERADO" | "BAIXO" | "OK" {
  if (quantidade <= 0) return "ZERADO";
  if (quantidade <= estoqueMinimo) return "BAIXO";
  return "OK";
}

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
