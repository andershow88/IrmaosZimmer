import { notFound } from "next/navigation";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import { resolveStatus } from "@/components/ui/status-badge";
import { getOrcamento } from "@/components/orcamentos/get-orcamento";
import { PrintButton } from "@/components/orcamentos/print-button";

export const dynamic = "force-dynamic";

export default async function ImprimirOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const o = await getOrcamento(id);
  if (!o) notFound();

  const subtotal = o.items.reduce((acc, i) => acc + i.subtotal, 0);
  const statusLabel = resolveStatus("orcamento", o.status).label;

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
          <p className="text-lg font-bold">Orçamento</p>
          <p className="text-sm">{o.numero}</p>
          <p className="text-sm text-gray-600">{statusLabel}</p>
        </div>
      </div>

      {/* Dados */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold uppercase text-gray-500">Cliente</p>
          <p>{o.cliente.nome}</p>
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Veículo</p>
          <p>
            {o.veiculo.marca} {o.veiculo.modelo} — {o.veiculo.placa}
          </p>
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Data</p>
          <p>{formatDateBR(o.createdAt)}</p>
        </div>
        <div>
          <p className="font-semibold uppercase text-gray-500">Validade</p>
          <p>{o.validade ? formatDateBR(o.validade) : "—"}</p>
        </div>
      </div>

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
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-gray-300">
              <td className="py-2">{i.descricao}</td>
              <td className="py-2 text-center">
                {i.tipo === "SERVICO" ? "Serviço" : "Peça"}
              </td>
              <td className="py-2 text-right">{i.quantidade}</td>
              <td className="py-2 text-right">{formatBRL(i.precoUnitario)}</td>
              <td className="py-2 text-right">{formatBRL(i.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Desconto</span>
            <span>- {formatBRL(o.desconto)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
            <span>Total</span>
            <span>{formatBRL(o.total)}</span>
          </div>
        </div>
      </div>

      {o.observacoes && (
        <div className="mt-6 text-sm">
          <p className="font-semibold uppercase text-gray-500">Observações</p>
          <p className="whitespace-pre-wrap">{o.observacoes}</p>
        </div>
      )}

      <div className="mt-12 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
        Este orçamento é válido conforme a data de validade informada. Obrigado
        pela preferência — Irmãos Zimmer.
      </div>
    </div>
  );
}
