import Link from "next/link";
import { Users, Plus, Car, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ClientesSearch } from "@/components/clientes/clientes-search";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = query
    ? {
        OR: [
          { nome: { contains: query, mode: "insensitive" as const } },
          { cpfCnpj: { contains: query, mode: "insensitive" as const } },
          { cidade: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const clientes = await prisma.customer.findMany({
    where,
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
      _count: { select: { vehicles: true } },
    },
  });

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

      <div className="mb-4">
        <ClientesSearch initialQuery={query} />
      </div>

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          message={
            query
              ? "Tente ajustar os termos da busca."
              : "Cadastre o primeiro cliente para começar."
          }
          action={
            !query ? (
              <Link href="/painel/clientes/novo">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Novo cliente
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Tipo</TH>
              <TH>CPF / CNPJ</TH>
              <TH>Contato</TH>
              <TH>Cidade</TH>
              <TH className="text-center">Veículos</TH>
            </TR>
          </THead>
          <TBody>
            {clientes.map((c) => (
              <TR key={c.id} className="group">
                <TD>
                  <Link
                    href={`/painel/clientes/${c.id}`}
                    className="font-semibold text-foreground hover:text-accent transition"
                  >
                    {c.nome}
                  </Link>
                </TD>
                <TD>
                  <Badge variant={c.tipoPessoa === "JURIDICA" ? "info" : "default"}>
                    {c.tipoPessoa === "JURIDICA" ? "Jurídica" : "Física"}
                  </Badge>
                </TD>
                <TD className="text-muted">{c.cpfCnpj || "—"}</TD>
                <TD className="text-muted">
                  {c.whatsapp || c.telefone || "—"}
                </TD>
                <TD className="text-muted">
                  {c.cidade ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.cidade}
                      {c.estado ? `/${c.estado}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD className="text-center">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Car className="h-3.5 w-3.5" />
                    {c._count.vehicles}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
