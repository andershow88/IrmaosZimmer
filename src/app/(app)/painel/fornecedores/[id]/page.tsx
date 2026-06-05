import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Truck,
  Pencil,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  Hash,
  User,
  Package,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge, nivelEstoque } from "@/components/ui/status-badge";
import { maskCPFCNPJ } from "@/lib/masks";
import { waLink } from "@/lib/whatsapp";
import { formatBRL, formatNumber } from "@/lib/utils";
import { FornecedorDelete } from "@/components/fornecedores/fornecedor-delete";

export const dynamic = "force-dynamic";

export default async function FornecedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const fornecedor = await prisma.supplier.findUnique({
    where: { id },
    include: {
      parts: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          codigoInterno: true,
          categoria: true,
          quantidade: true,
          estoqueMinimo: true,
          precoCusto: true,
        },
      },
    },
  });

  if (!fornecedor) notFound();

  const waPhone = fornecedor.whatsapp ?? fornecedor.telefone;

  return (
    <div>
      <PageHeader
        title={fornecedor.nome}
        description="Detalhes do fornecedor e peças fornecidas."
        icon={Truck}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/painel/fornecedores/${fornecedor.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            <FornecedorDelete id={fornecedor.id} nome={fornecedor.nome} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados de contato</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <InfoRow icon={Hash} label="CNPJ">
                {fornecedor.cnpj ? maskCPFCNPJ(fornecedor.cnpj) : "—"}
              </InfoRow>
              <InfoRow icon={User} label="Contato">
                {fornecedor.contato ?? "—"}
              </InfoRow>
              <InfoRow icon={Phone} label="Telefone">
                {fornecedor.telefone ?? "—"}
              </InfoRow>
              <InfoRow icon={MessageCircle} label="WhatsApp">
                {fornecedor.whatsapp ?? "—"}
              </InfoRow>
              <InfoRow icon={Mail} label="E-mail">
                {fornecedor.email ? (
                  <a
                    href={`mailto:${fornecedor.email}`}
                    className="text-accent hover:underline"
                  >
                    {fornecedor.email}
                  </a>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow icon={MapPin} label="Endereço">
                {fornecedor.endereco ?? "—"}
              </InfoRow>
            </CardBody>
            {waPhone && (
              <div className="border-t border-border px-5 py-3">
                <a
                  href={waLink(
                    waPhone,
                    `Olá! Aqui é da oficina Irmãos Zimmer. Gostaríamos de falar sobre um pedido de peças.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm", className: "w-full" })}
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </Card>

          {fornecedor.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="flex items-start gap-2 whitespace-pre-wrap text-sm text-muted">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  {fornecedor.observacoes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Peças fornecidas{" "}
                <span className="text-muted">({fornecedor.parts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              {fornecedor.parts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Nenhuma peça vinculada"
                  message="Vincule peças a este fornecedor no módulo de Peças/Estoque."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Peça</TH>
                      <TH>Código</TH>
                      <TH>Categoria</TH>
                      <TH className="text-right">Estoque</TH>
                      <TH className="text-right">Custo</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {fornecedor.parts.map((p) => (
                      <TR key={p.id}>
                        <TD className="font-medium">{p.nome}</TD>
                        <TD className="text-muted">{p.codigoInterno}</TD>
                        <TD className="text-muted">{p.categoria ?? "—"}</TD>
                        <TD className="text-right">
                          <span className="inline-flex items-center justify-end gap-2">
                            <span className="text-muted">
                              {formatNumber(p.quantidade)}
                            </span>
                            <StatusBadge
                              kind="estoque"
                              status={nivelEstoque(p.quantidade, p.estoqueMinimo)}
                            />
                          </span>
                        </TD>
                        <TD className="text-right text-muted">
                          {formatBRL(p.precoCusto)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Hash;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="break-words text-foreground">{children}</p>
      </div>
    </div>
  );
}
