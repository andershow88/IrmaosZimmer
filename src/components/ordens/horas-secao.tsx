import { Timer, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeBR } from "@/lib/utils";
import { formatDuracao } from "@/lib/horas";
import { ApontamentoToggle } from "@/components/ordens/apontamento-toggle";

export type ApontamentoView = {
  id: string;
  mecanico: string;
  inicio: Date;
  fim: Date | null;
  minutos: number | null;
  emAndamento: boolean;
};

/**
 * Seção "Horas" da OS (Server Component).
 * Mostra tempo previsto x executado, alarme de excesso e a lista de
 * apontamentos. O cálculo do executado já inclui o tempo decorrido dos
 * apontamentos abertos.
 */
export function HorasSecao({
  serviceOrderId,
  tempoPrevistoMin,
  apontamentos,
  apontamentoAbertoId,
  desabilitado = false,
}: {
  serviceOrderId: string;
  tempoPrevistoMin: number;
  apontamentos: ApontamentoView[];
  apontamentoAbertoId: string | null;
  desabilitado?: boolean;
}) {
  const previsto = tempoPrevistoMin > 0 ? tempoPrevistoMin : 0;

  const agora = Date.now();
  const executado = apontamentos.reduce((acc, a) => {
    if (a.fim && a.minutos != null) return acc + a.minutos;
    // Apontamento aberto: conta o tempo decorrido até agora.
    if (a.emAndamento) {
      const decorrido = Math.max(0, Math.round((agora - a.inicio.getTime()) / 60000));
      return acc + decorrido;
    }
    return acc;
  }, 0);

  const excedido = previsto > 0 && executado > previsto;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Timer className="h-4 w-4 text-accent" />
            Horas
          </span>
        </CardTitle>
        <ApontamentoToggle
          serviceOrderId={serviceOrderId}
          apontamentoAbertoId={apontamentoAbertoId}
          desabilitado={desabilitado}
        />
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-muted">Previsto</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {previsto > 0 ? formatDuracao(previsto) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Executado</p>
            <p
              className={
                "text-lg font-bold tabular-nums " +
                (excedido ? "text-danger" : "text-foreground")
              }
            >
              {formatDuracao(executado)}
            </p>
          </div>
          {excedido && (
            <Badge variant="danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Tempo excedido
            </Badge>
          )}
        </div>

        {apontamentos.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="Nenhum apontamento"
            message="Inicie o cronômetro para registrar as horas trabalhadas nesta OS."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Mecânico</TH>
                <TH>Início</TH>
                <TH>Fim</TH>
                <TH className="text-right">Duração</TH>
              </TR>
            </THead>
            <TBody>
              {apontamentos.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium text-foreground">{a.mecanico}</TD>
                  <TD className="text-muted">{formatDateTimeBR(a.inicio)}</TD>
                  <TD className="text-muted">
                    {a.fim ? (
                      formatDateTimeBR(a.fim)
                    ) : (
                      <Badge variant="info">Em andamento</Badge>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {a.fim ? formatDuracao(a.minutos) : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
