import Link from "next/link";
import { notFound } from "next/navigation";
import { Car, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  VeiculoForm,
  type VeiculoFormValues,
} from "@/components/veiculos/veiculo-form";

export const dynamic = "force-dynamic";

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [veiculo, clientes] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        placa: true,
        marca: true,
        modelo: true,
        ano: true,
        cor: true,
        quilometragem: true,
        chassi: true,
        renavam: true,
        combustivel: true,
        observacoes: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  if (!veiculo) notFound();

  const initial: VeiculoFormValues = {
    customerId: veiculo.customerId,
    placa: veiculo.placa,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: veiculo.ano,
    cor: veiculo.cor,
    quilometragem: veiculo.quilometragem,
    chassi: veiculo.chassi,
    renavam: veiculo.renavam,
    combustivel: veiculo.combustivel,
    observacoes: veiculo.observacoes,
  };

  return (
    <div>
      <PageHeader
        title="Editar veículo"
        description={`${veiculo.marca} ${veiculo.modelo} — ${veiculo.placa}`}
        icon={Car}
        action={
          <Link href={`/painel/veiculos/${veiculo.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <VeiculoForm
        clientes={clientes}
        veiculoId={veiculo.id}
        initial={initial}
      />
    </div>
  );
}
