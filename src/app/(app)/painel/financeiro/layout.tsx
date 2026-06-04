import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { requirePageModule } from "@/lib/permissions-server";
import { PageHeader } from "@/components/ui/page-header";
import { FinanceiroNav } from "@/components/financeiro/nav";

export const dynamic = "force-dynamic";

export default async function FinanceiroLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageModule("financeiro");

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar/receber, fluxo de caixa e fechamento de caixa."
        icon={Wallet}
      />
      <FinanceiroNav />
      {children}
    </div>
  );
}
