import Link from "next/link";
import { FilePlus, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { OrcamentoForm } from "@/components/orcamentos/orcamento-form";

export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  await requireUser();

  const [clientes, ordens, servicos, pecas] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        vehicles: {
          orderBy: { placa: "asc" },
          select: { id: true, placa: true, marca: true, modelo: true },
        },
      },
    }),
    prisma.serviceOrder.findMany({
      where: { status: { notIn: ["CANCELADA", "ENTREGUE"] } },
      orderBy: { dataAbertura: "desc" },
      take: 100,
      select: {
        id: true,
        numero: true,
        customer: { select: { nome: true } },
        vehicle: { select: { placa: true, marca: true, modelo: true } },
      },
    }),
    prisma.service.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, precoPadrao: true },
    }),
    prisma.part.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, codigoInterno: true, precoVenda: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Novo orçamento"
        description="Monte um orçamento a partir de uma OS ou de forma avulsa."
        icon={FilePlus}
        action={
          <Link href="/painel/orcamentos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <OrcamentoForm
        clientes={clientes.map((c) => ({
          id: c.id,
          nome: c.nome,
          veiculos: c.vehicles,
        }))}
        ordens={ordens.map((o) => ({
          id: o.id,
          numero: o.numero,
          clienteNome: o.customer.nome,
          veiculoLabel: `${o.vehicle.marca} ${o.vehicle.modelo} • ${o.vehicle.placa}`,
        }))}
        servicos={servicos.map((s) => ({
          id: s.id,
          nome: s.nome,
          precoPadrao: Number(s.precoPadrao),
        }))}
        pecas={pecas.map((p) => ({
          id: p.id,
          nome: p.nome,
          codigoInterno: p.codigoInterno,
          precoVenda: Number(p.precoVenda),
        }))}
      />
    </div>
  );
}
