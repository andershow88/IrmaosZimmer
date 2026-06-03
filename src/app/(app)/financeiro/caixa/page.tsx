import { History } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ReportCard } from "@/components/relatorios/report-card";
import {
  AbrirCaixaCard,
  CaixaAbertaPanel,
  type SessaoAberta,
  type MovimentoRow,
} from "@/components/financeiro/caixa-controls";
import { calcularSaldoSessao } from "@/lib/financeiro-calc";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const [aberta, ultimasFechadas] = await Promise.all([
    prisma.cashSession.findFirst({
      where: { status: "ABERTO" },
      include: { movements: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.cashSession.findMany({
      where: { status: "FECHADO" },
      orderBy: { fechamento: "desc" },
      take: 10,
    }),
  ]);

  let sessao: SessaoAberta | null = null;
  if (aberta) {
    const movimentos: MovimentoRow[] = aberta.movements.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      valor: Number(m.valor),
      descricao: m.descricao,
      formaPagamento: m.formaPagamento,
      createdAt: m.createdAt.toISOString(),
    }));
    const totalEntradas = movimentos
      .filter((m) => m.tipo === "ENTRADA")
      .reduce((acc, m) => acc + m.valor, 0);
    const totalSaidas = movimentos
      .filter((m) => m.tipo === "SAIDA")
      .reduce((acc, m) => acc + m.valor, 0);

    sessao = {
      id: aberta.id,
      abertura: aberta.abertura.toISOString(),
      valorAbertura: Number(aberta.valorAbertura),
      saldoAtual: calcularSaldoSessao(Number(aberta.valorAbertura), aberta.movements),
      totalEntradas,
      totalSaidas,
      movimentos,
    };
  }

  return (
    <div className="space-y-6">
      {sessao ? <CaixaAbertaPanel sessao={sessao} /> : <AbrirCaixaCard />}

      <ReportCard
        title="Últimos fechamentos"
        icon={History}
        description="Histórico das 10 sessões de caixa mais recentes já fechadas"
      >
        {ultimasFechadas.length > 0 ? (
          <Table>
            <THead>
              <TR>
                <TH>Abertura</TH>
                <TH>Fechamento</TH>
                <TH className="text-right">Valor abertura</TH>
                <TH className="text-right">Valor fechamento</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {ultimasFechadas.map((s) => (
                <TR key={s.id}>
                  <TD className="text-sm">{formatDateTimeBR(s.abertura)}</TD>
                  <TD className="text-sm">
                    {s.fechamento ? formatDateTimeBR(s.fechamento) : "—"}
                  </TD>
                  <TD className="text-right tabular-nums">{formatBRL(s.valorAbertura)}</TD>
                  <TD className="text-right tabular-nums font-medium">
                    {s.valorFechamento !== null ? formatBRL(s.valorFechamento) : "—"}
                  </TD>
                  <TD>
                    <Badge variant="outline">Fechado</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="grid h-32 place-items-center rounded-xl border border-dashed border-border bg-surface/30">
            <p className="text-sm text-muted">Nenhuma sessão de caixa fechada ainda.</p>
          </div>
        )}
      </ReportCard>
    </div>
  );
}
