import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  CreditCard,
  Package,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { greeting } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${greeting()}${firstName ? `, ${firstName}` : ""}! Visão geral da oficina.`}
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="OS abertas"
          value="0"
          icon={ClipboardList}
          tone="accent"
          hint="Nenhuma ordem em andamento"
        />
        <StatCard
          label="Agendamentos hoje"
          value="0"
          icon={CalendarDays}
          tone="info"
          hint="Agenda do dia"
        />
        <StatCard
          label="A receber"
          value="R$ 0,00"
          icon={CreditCard}
          tone="warning"
          hint="Pagamentos pendentes"
        />
        <StatCard
          label="Faturamento do mês"
          value="R$ 0,00"
          icon={CreditCard}
          tone="success"
          hint="Mês atual"
        />
        <StatCard
          label="Peças em falta"
          value="0"
          icon={Package}
          tone="danger"
          hint="Abaixo do estoque mínimo"
        />
        <StatCard
          label="Clientes"
          value="0"
          icon={Users}
          tone="accent"
          hint="Total cadastrado"
        />
      </div>

      <Card className="mt-6">
        <CardBody>
          <p className="text-sm text-muted">
            Este é um painel de demonstração. Os indicadores e listas serão
            preenchidos com dados reais nas próximas etapas do projeto.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
