import { Receipt, CreditCard, ClipboardCheck } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { ContasAFaturarTable } from "@/components/financeiro/contas-a-faturar-table";
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

      <ContasAFaturarTable ordens={ordens} />
    </div>
  );
}
