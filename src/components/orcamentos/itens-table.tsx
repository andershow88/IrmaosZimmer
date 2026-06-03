import { Wrench, Package } from "lucide-react";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";
import type { OrcamentoItemView } from "./types";

export function ItensTable({ items }: { items: OrcamentoItemView[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Tipo</TH>
          <TH>Descrição</TH>
          <TH className="text-right">Qtd.</TH>
          <TH className="text-right">Preço unit.</TH>
          <TH className="text-right">Subtotal</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((i) => (
          <TR key={i.id}>
            <TD>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                {i.tipo === "SERVICO" ? (
                  <Wrench className="h-3.5 w-3.5" />
                ) : (
                  <Package className="h-3.5 w-3.5" />
                )}
                {i.tipo === "SERVICO" ? "Serviço" : "Peça"}
              </span>
            </TD>
            <TD className="font-medium">{i.descricao}</TD>
            <TD className="text-right tabular-nums">{i.quantidade}</TD>
            <TD className="text-right tabular-nums">{formatBRL(i.precoUnitario)}</TD>
            <TD className="text-right font-semibold tabular-nums">
              {formatBRL(i.subtotal)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
