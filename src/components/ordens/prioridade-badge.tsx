import { Badge, type BadgeVariant } from "@/components/ui/badge";

type Prioridade = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

const MAP: Record<Prioridade, { label: string; variant: BadgeVariant }> = {
  BAIXA: { label: "Baixa", variant: "outline" },
  NORMAL: { label: "Normal", variant: "default" },
  ALTA: { label: "Alta", variant: "warning" },
  URGENTE: { label: "Urgente", variant: "danger" },
};

export function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const entry = MAP[prioridade as Prioridade] ?? { label: prioridade, variant: "default" as BadgeVariant };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
