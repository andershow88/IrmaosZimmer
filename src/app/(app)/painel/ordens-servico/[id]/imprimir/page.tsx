import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { resolveStatus } from "@/components/ui/status-badge";
import { PrintButton } from "@/components/orcamentos/print-button";

export const dynamic = "force-dynamic";

function n(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const x = Number(v.toString());
  return Number.isFinite(x) ? x : 0;
}

export default async function ImprimirOSPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const os = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      mecanico: { select: { name: true } },
      items: { orderBy: { tipo: "asc" } },
    },
  });
  if (!os) notFound();

  const statusLabel = resolveStatus("os", os.status).label;

  return (
    <div className="print-root mx-auto max-w-3xl bg-white p-8 text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-root {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          @page { margin: 16mm; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="mb-6 flex justify-end">
        <PrintButton />
      </div>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold">Irmãos Zimmer</h1>
          <p className="text-sm text-gray-600">
            Oficina Mecânica — Santa Maria do Herval/RS
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">Ordem de Serviço</p>
          <p className="text-sm">{os.numero}</p>
          <p className="text-sm text-gray-600">{statusLabel}</p>
        </div>
      </div>

      {/* Dados */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold uppercase text-gray-500">Cliente</p>
          <p>{os.customer.nome}</p>
          {(os.customer.whatsapp || os.customer.telefone) && (
            <p className="text-gray-600">
              {os.customer.whatsapp || os.customer.telefone}
            </p>
          )}
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Veículo</p>
          <p>
            {os.vehicle.marca} {os.vehicle.modelo} — {os.vehicle.placa}
          </p>
          {os.quilometragem != null && (
            <p className="text-gray-600">
              {os.quilometragem.toLocaleString("pt-BR")} km
            </p>
          )}
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Abertura</p>
          <p>{formatDateTimeBR(os.dataAbertura)}</p>
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Previsão</p>
          <p>{os.previsaoEntrega ? formatDateTimeBR(os.previsaoEntrega) : "—"}</p>
        </div>
        {os.mecanico?.name && (
          <div>
            <p className="font-semibold uppercase text-gray-500">Mecânico</p>
            <p>{os.mecanico.name}</p>
          </div>
        )}
      </div>

      {/* Problema / diagnóstico */}
      {(os.problemaRelatado || os.diagnostico) && (
        <div className="mt-6 grid grid-cols-1 gap-3 text-sm">
          {os.problemaRelatado && (
            <div>
              <p className="font-semibold uppercase text-gray-500">
                Problema relatado
              </p>
              <p className="whitespace-pre-wrap">{os.problemaRelatado}</p>
            </div>
          )}
          {os.diagnostico && (
            <div>
              <p className="font-semibold uppercase text-gray-500">Diagnóstico</p>
              <p className="whitespace-pre-wrap">{os.diagnostico}</p>
            </div>
          )}
        </div>
      )}

      {/* Itens */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2">Descrição</th>
            <th className="py-2 text-center">Tipo</th>
            <th className="py-2 text-right">Qtd.</th>
            <th className="py-2 text-right">Preço unit.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {os.items.map((i) => (
            <tr key={i.id} className="border-b border-gray-300">
              <td className="py-2">{i.descricao}</td>
              <td className="py-2 text-center">
                {i.tipo === "SERVICO" ? "Serviço" : "Peça"}
              </td>
              <td className="py-2 text-right">{i.quantidade}</td>
              <td className="py-2 text-right">{formatBRL(n(i.precoUnitario))}</td>
              <td className="py-2 text-right">{formatBRL(n(i.subtotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Mão de obra</span>
            <span>{formatBRL(n(os.valorMaoObra))}</span>
          </div>
          <div className="flex justify-between">
            <span>Peças</span>
            <span>{formatBRL(n(os.valorPecas))}</span>
          </div>
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>- {formatBRL(n(os.desconto))}</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
            <span>Total</span>
            <span>{formatBRL(n(os.total))}</span>
          </div>
        </div>
      </div>

      {os.obsCliente && (
        <div className="mt-6 text-sm">
          <p className="font-semibold uppercase text-gray-500">Observações</p>
          <p className="whitespace-pre-wrap">{os.obsCliente}</p>
        </div>
      )}

      <div className="mt-12 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
        Documento gerado em {formatDateBR(new Date())} — Irmãos Zimmer. Obrigado
        pela preferência.
      </div>
    </div>
  );
}
