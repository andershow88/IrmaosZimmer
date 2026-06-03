"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/utils";
import { removeItem } from "@/server/ordens";

export type OSItem = {
  id: string;
  tipo: "SERVICO" | "PECA";
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

export function ItemList({
  items,
  podeRemover,
}: {
  items: OSItem[];
  podeRemover: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<OSItem | null>(null);

  function confirmRemove() {
    if (!toRemove) return;
    setError(null);
    const id = toRemove.id;
    startTransition(async () => {
      const res = await removeItem(id);
      if (res.ok) {
        setToRemove(null);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao remover item.");
        setToRemove(null);
      }
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum item adicionado"
        message="Adicione serviços do catálogo ou peças do estoque a esta OS."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <THead>
          <TR>
            <TH>Tipo</TH>
            <TH>Descrição</TH>
            <TH className="text-right">Qtd.</TH>
            <TH className="text-right">Unitário</TH>
            <TH className="text-right">Subtotal</TH>
            {podeRemover && <TH className="text-right">Ações</TH>}
          </TR>
        </THead>
        <TBody>
          {items.map((i) => (
            <TR key={i.id}>
              <TD>
                <Badge variant={i.tipo === "SERVICO" ? "accent" : "info"}>
                  {i.tipo === "SERVICO" ? (
                    <Wrench className="h-3 w-3" />
                  ) : (
                    <Package className="h-3 w-3" />
                  )}
                  {i.tipo === "SERVICO" ? "Serviço" : "Peça"}
                </Badge>
              </TD>
              <TD className="font-medium">{i.descricao}</TD>
              <TD className="text-right tabular-nums">{i.quantidade}</TD>
              <TD className="text-right tabular-nums">{formatBRL(i.precoUnitario)}</TD>
              <TD className="text-right font-semibold tabular-nums">
                {formatBRL(i.subtotal)}
              </TD>
              {podeRemover && (
                <TD className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover item"
                    disabled={pending}
                    onClick={() => setToRemove(i)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <ConfirmDialog
        open={toRemove !== null}
        title="Remover item"
        description={
          toRemove
            ? toRemove.tipo === "PECA"
              ? `Remover "${toRemove.descricao}"? O estoque será devolvido (${toRemove.quantidade} un.).`
              : `Remover o serviço "${toRemove.descricao}" desta OS?`
            : ""
        }
        confirmLabel="Remover"
        variant="danger"
        loading={pending}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
