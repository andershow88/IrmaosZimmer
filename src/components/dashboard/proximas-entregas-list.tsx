import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDateBR } from "@/lib/utils";
import type { ProximaEntrega } from "@/server/dashboard";

export function ProximasEntregasList({ itens }: { itens: ProximaEntrega[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nenhuma entrega prevista"
        message="As ordens com previsão de entrega a partir de hoje aparecerão aqui."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>OS</TH>
          <TH>Cliente</TH>
          <TH>Veículo</TH>
          <TH>Previsão</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <TBody>
        {itens.map((os) => (
          <TR key={os.id}>
            <TD className="font-semibold">
              <Link
                href={`/ordens-servico/${os.id}`}
                className="text-accent hover:underline"
              >
                {os.numero}
              </Link>
            </TD>
            <TD className="max-w-[12rem] truncate">{os.clienteNome}</TD>
            <TD>
              <span className="text-foreground">{os.veiculo}</span>
              <span className="ml-1 text-xs uppercase text-muted">
                {os.placa}
              </span>
            </TD>
            <TD className="tabular-nums">
              {os.previsaoEntrega ? formatDateBR(os.previsaoEntrega) : "—"}
            </TD>
            <TD>
              <StatusBadge kind="os" status={os.status} />
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
