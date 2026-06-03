import Link from "next/link";
import { Truck, Plus, Building2, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { maskCPFCNPJ } from "@/lib/masks";
import { FornecedorSearch } from "@/components/fornecedores/fornecedor-search";

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

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores de peças e serviços."
        icon={Truck}
        action={
          <Link href="/fornecedores/novo" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </Link>
        }
      />

      <div className="mb-4">
        <FornecedorSearch />
      </div>

      {fornecedores.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={termo ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
          message={
            termo
              ? "Tente outro termo de busca por nome ou CNPJ."
              : "Cadastre o primeiro fornecedor para vincular às peças do estoque."
          }
          action={
            !termo ? (
              <Link href="/fornecedores/novo" className={buttonVariants({ size: "sm" })}>
                <Plus className="h-4 w-4" />
                Novo fornecedor
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>CNPJ</TH>
              <TH>Contato</TH>
              <TH>Telefone</TH>
              <TH className="text-right">Peças</TH>
            </TR>
          </THead>
          <TBody>
            {fornecedores.map((f) => (
              <TR key={f.id} className="cursor-pointer">
                <TD>
                  <Link
                    href={`/fornecedores/${f.id}`}
                    className="font-semibold text-foreground hover:text-accent"
                  >
                    {f.nome}
                  </Link>
                </TD>
                <TD className="text-muted">{f.cnpj ? maskCPFCNPJ(f.cnpj) : "—"}</TD>
                <TD className="text-muted">{f.contato ?? "—"}</TD>
                <TD className="text-muted">{f.telefone ?? f.whatsapp ?? "—"}</TD>
                <TD className="text-right">
                  <Badge variant={f._count.parts > 0 ? "accent" : "outline"}>
                    <Package className="h-3 w-3" />
                    {f._count.parts}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
