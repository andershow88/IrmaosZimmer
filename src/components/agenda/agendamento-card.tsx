import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Car, Wrench } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusAgendamento } from "@prisma/client";

export interface AgendamentoCardData {
  id: string;
  dataHora: Date;
  duracaoMin: number;
  status: StatusAgendamento;
  servicoDesejado: string | null;
  customer: { nome: string };
  vehicle: { marca: string; modelo: string; placa: string } | null;
  mecanico: { name: string } | null;
}

/**
 * Cartão responsivo de um agendamento (usado na visão de lista da agenda).
 * Apenas apresentação — sem lógica de negócio nem queries.
 */
export function AgendamentoCard({
  agendamento: a,
}: {
  agendamento: AgendamentoCardData;
}) {
  const veiculo = a.vehicle
    ? `${a.vehicle.marca} ${a.vehicle.modelo}${a.vehicle.placa ? ` · ${a.vehicle.placa}` : ""}`
    : "Sem veículo";

  return (
    <Link
      href={`/painel/agenda/${a.id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition hover:border-border-strong/70 hover:shadow-md">
        <CardBody className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
              {format(a.dataHora, "HH:mm", { locale: ptBR })}
              <span className="text-xs font-normal text-muted">
                · {a.duracaoMin} min
              </span>
            </div>
            <StatusBadge kind="agendamento" status={a.status} />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <User className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate font-medium">{a.customer.nome}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Car className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{veiculo}</span>
          </div>

          {a.servicoDesejado && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{a.servicoDesejado}</span>
            </div>
          )}

          <div className="mt-0.5 text-xs text-subtle">
            {a.mecanico?.name
              ? `Mecânico: ${a.mecanico.name}`
              : "Sem mecânico definido"}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
