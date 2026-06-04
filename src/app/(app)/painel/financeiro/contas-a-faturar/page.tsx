import Link from "next/link";
import {
  FileText,
  Receipt,
  ExternalLink,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { getOSaFaturar } from "@/server/financeiro";

export const dynamic = "force-dynamic";

export default async function ContasAFaturarPage() {
  const { ordens, totalSaldo } = await getOSaFaturar();

  const totalBruto = ordens.reduce((acc, o) => acc + o.total, 0);
  const totalRecebido = ordens.reduce((acc, o) => acc + o.pago, 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="OS concluídas a faturar"
          value={String(ordens.length)}
          icon={ClipboardCheck}
          tone="warning"
          hint="Com saldo em aberto"
        />
        <StatCard
          label="Saldo total a faturar"
          value={formatBRL(totalSaldo)}
          icon={Receipt}
          tone="danger"
          hint="Total − pagamentos pagos"
        />
        <StatCard
          label="Já recebido"
          value={formatBRL(totalRecebido)}
          icon={CreditCard}
          tone="success"
          hint={`de ${formatBRL(totalBruto)} faturados`}
        />
      </div>

      {ordens.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma OS a faturar"
          message="Todas as ordens de serviço concluídas já estão quitadas."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>OS</TH>
              <TH>Cliente</TH>
              <TH>Veículo</TH>
              <TH>Concluída em</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Pago</TH>
              <TH className="text-right">Saldo</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {ordens.map((os) => (
              <TR key={os.id}>
                <TD className="font-medium">
                  <Link
                    href={`/painel/ordens-servico/${os.id}`}
                    className="text-accent hover:underline"
                  >
                    {os.numero}
                  </Link>
                </TD>
                <TD>{os.cliente}</TD>
                <TD>
                  <span className="text-foreground">{os.veiculo}</span>
                  <span className="ml-2 text-xs text-muted">{os.placa}</span>
                </TD>
                <TD className="whitespace-nowrap text-muted">
                  {formatDateBR(os.dataAbertura)}
                </TD>
                <TD className="text-right tabular-nums">{formatBRL(os.total)}</TD>
                <TD className="text-right tabular-nums text-muted">
                  {formatBRL(os.pago)}
                </TD>
                <TD className="text-right tabular-nums">
                  <Badge variant={os.pago > 0 ? "warning" : "danger"}>
                    {formatBRL(os.saldo)}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/painel/ordens-servico/${os.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        Ver OS
                      </Button>
                    </Link>
                    <Link href="/painel/pagamentos/novo">
                      <Button variant="outline" size="sm">
                        <CreditCard className="h-4 w-4" />
                        Faturar
                      </Button>
                    </Link>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
