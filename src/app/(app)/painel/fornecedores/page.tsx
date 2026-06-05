import Link from "next/link";
import { Truck, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  FornecedoresTable,
  type FornecedorRow,
} from "@/components/fornecedores/fornecedores-table";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  const fornecedores = await prisma.supplier.findMany({
    where: termo
      ? {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { cnpj: { contains: termo, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      cnpj: true,
      contato: true,
      telefone: true,
      whatsapp: true,
      _count: { select: { parts: true } },
    },
  });

  const rows: FornecedorRow[] = fornecedores.map((f) => ({
    id: f.id,
    nome: f.nome,
    cnpj: f.cnpj,
    contato: f.contato,
    telefone: f.telefone ?? f.whatsapp ?? null,
    pecas: f._count.parts,
  }));

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores de peças e serviços."
        icon={Truck}
        action={
          <Link href="/painel/fornecedores/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Button>
          </Link>
        }
      />

      <FornecedoresTable fornecedores={rows} initialQuery={termo} />
    </div>
  );
}
