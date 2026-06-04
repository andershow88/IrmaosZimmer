import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  VeiculosList,
  type VeiculoListItem,
} from "@/components/veiculos/veiculos-list";

export const dynamic = "force-dynamic";

export default async function VeiculosPage() {
  await requireUser();

  const veiculos = await prisma.vehicle.findMany({
    orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    select: {
      id: true,
      placa: true,
      marca: true,
      modelo: true,
      ano: true,
      cor: true,
      combustivel: true,
      customer: { select: { id: true, nome: true } },
      _count: { select: { serviceOrders: true } },
    },
  });

  const items: VeiculoListItem[] = veiculos.map((v) => ({
    id: v.id,
    placa: v.placa,
    marca: v.marca,
    modelo: v.modelo,
    ano: v.ano,
    cor: v.cor,
    combustivel: v.combustivel,
    clienteId: v.customer.id,
    clienteNome: v.customer.nome,
    totalOS: v._count.serviceOrders,
  }));

  return (
    <div>
      <PageHeader
        title="Veículos"
        description="Cadastro de veículos vinculados aos clientes."
        icon={Car}
        action={
          <Link href="/painel/veiculos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo veículo
            </Button>
          </Link>
        }
      />

      <VeiculosList veiculos={items} />
    </div>
  );
}
