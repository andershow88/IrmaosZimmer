import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  AuditoriaLista,
  type AuditLogRow,
} from "@/components/configuracoes/auditoria-lista";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AuditoriaPage() {
  await requirePageRole(["ADMINISTRADOR"]);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { user: { select: { name: true, email: true } } },
  });

  const rows: AuditLogRow[] = logs.map((l) => ({
    id: l.id,
    acao: l.acao,
    entidade: l.entidade,
    entidadeId: l.entidadeId,
    detalhe: l.detalhe,
    usuarioNome: l.user?.name ?? null,
    usuarioEmail: l.user?.email ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Log de auditoria"
        description="Histórico das ações sensíveis realizadas no sistema."
        icon={ScrollText}
        action={
          <Link href="/configuracoes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar às configurações
            </Button>
          </Link>
        }
      />

      <AuditoriaLista logs={rows} />
    </div>
  );
}
