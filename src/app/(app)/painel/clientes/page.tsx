import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  ClientesTable,
  type ClienteRow,
} from "@/components/clientes/clientes-table";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  const clientes = await prisma.customer.findMany({
    where: termo
      ? {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { cpfCnpj: { contains: termo, mode: "insensitive" } },
            { telefone: { contains: termo, mode: "insensitive" } },
            { whatsapp: { contains: termo, mode: "insensitive" } },
            { cidade: { contains: termo, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      tipoPessoa: true,
      cpfCnpj: true,
      telefone: true,
      whatsapp: true,
      cidade: true,
      estado: true,
      _count: {
        select: { vehicles: true, serviceOrders: true, quotes: true },
      },
    },
  });

  const rows: ClienteRow[] = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    tipoPessoa: c.tipoPessoa,
    cpfCnpj: c.cpfCnpj,
    contato: c.whatsapp || c.telefone || null,
    cidade: c.cidade,
    estado: c.estado,
    veiculos: c._count.vehicles,
    ordensServico: c._count.serviceOrders,
    orcamentos: c._count.quotes,
  }));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro e histórico de atendimento dos clientes da oficina."
        icon={Users}
        action={
          <Link href="/painel/clientes/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </Link>
        }
      />

      <ClientesTable clientes={rows} initialQuery={termo} />
    </div>
  );
}
