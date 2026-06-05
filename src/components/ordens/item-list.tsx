"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Wrench, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { RowActions } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/utils";
import { removeItem, readdItem } from "@/server/ordens";

export type OSItem = {
  id: string;
  tipo: "SERVICO" | "PECA";
  descricao: string;
  unidade?: string;
  quantidade: number;
  precoUnitario: number;
  /** Desconto unitário/total já aplicado (apenas exibição). */
  desconto?: number;
  subtotal: number;
  /** Referências para permitir desfazer a remoção (re-adicionar). */
  serviceId?: string | null;
  partId?: string | null;
};

export function ItemList({
  serviceOrderId,
  items,
  podeRemover,
}: {
  serviceOrderId: string;
  items: OSItem[];
  podeRemover: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<OSItem | null>(null);

  const totalGeral = items.reduce((acc, i) => acc + i.subtotal, 0);

  function desfazerRemocao(item: OSItem) {
    startTransition(async () => {
      const res = await readdItem({
        serviceOrderId,
        tipo: item.tipo,
        serviceId: item.serviceId ?? null,
        partId: item.partId ?? null,
        quantidade: item.quantidade,
      });
      if (res.ok) {
        toast({ title: "Remoção desfeita", variant: "success" });
        router.refresh();
      } else {
        toast({
          title: "Não foi possível desfazer",
          description: res.error,
          variant: "error",
        });
      }
    });
  }

  function confirmRemove() {
    if (!toRemove) return;
    setError(null);
    const item = toRemove;
    startTransition(async () => {
      const res = await removeItem(item.id);
      if (res.ok) {
        setToRemove(null);
        // Toast com ação "Desfazer" (re-adiciona o item removido).
        toast({
          title: "Item removido",
          description: (
            <span className="flex items-center gap-2">
              <span className="truncate">{item.descricao}</span>
              <button
                type="button"
                onClick={() => desfazerRemocao(item)}
                className="shrink-0 font-semibold text-accent underline underline-offset-2 hover:text-accent/80 cursor-pointer"
              >
                Desfazer
              </button>
            </span>
          ),
          variant: "info",
          duration: 8000,
        });
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
            <TH scope="col">Tipo</TH>
            <TH scope="col">Descrição</TH>
            <TH scope="col" className="text-center">
              Un.
            </TH>
            <TH scope="col" className="text-right">
              Qtd.
            </TH>
            <TH scope="col" className="text-right">
              Preço unit.
            </TH>
            <TH scope="col" className="text-right">
              Desconto
            </TH>
            <TH scope="col" className="text-right">
              Subtotal
            </TH>
            {podeRemover && (
              <TH scope="col" className="text-right">
                <span className="sr-only">Ações</span>
              </TH>
            )}
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
              <TD className="text-center text-muted">{i.unidade ?? "un"}</TD>
              <TD className="text-right tabular-nums">{i.quantidade}</TD>
              <TD className="text-right tabular-nums">{formatBRL(i.precoUnitario)}</TD>
              <TD className="text-right tabular-nums text-muted">
                {i.desconto && i.desconto > 0 ? `− ${formatBRL(i.desconto)}` : "—"}
              </TD>
              <TD className="text-right font-semibold tabular-nums">
                {formatBRL(i.subtotal)}
              </TD>
              {podeRemover && (
                <TD className="text-right">
                  <RowActions
                    label={`Ações do item ${i.descricao}`}
                    items={[
                      {
                        label: "Remover item",
                        icon: Trash2,
                        variant: "danger",
                        disabled: pending,
                        onClick: () => setToRemove(i),
                      },
                    ]}
                  />
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>

      {/* Total recalculado visível */}
      <div className="flex justify-end border-t border-border pt-3">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-muted">Soma dos itens</span>
          <span className="text-lg font-bold tabular-nums text-accent">
            {formatBRL(totalGeral)}
          </span>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <ConfirmDialog
        open={toRemove !== null}
        title="Remover item"
        description={
          toRemove
            ? toRemove.tipo === "PECA"
              ? `Remover "${toRemove.descricao}"? O estoque será devolvido (${toRemove.quantidade} un.). Você poderá desfazer logo após.`
              : `Remover o serviço "${toRemove.descricao}" desta OS? Você poderá desfazer logo após.`
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
