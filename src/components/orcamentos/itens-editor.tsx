"use client";

import { Plus, Trash2, Wrench, Package } from "lucide-react";
import type { TipoItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/utils";
import type { ServicoOption, PecaOption } from "./types";

export type ItemDraft = {
  key: string;
  tipo: TipoItem;
  serviceId: string | null;
  partId: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
};

export function novoItemDraft(): ItemDraft {
  return {
    key: Math.random().toString(36).slice(2),
    tipo: "SERVICO",
    serviceId: null,
    partId: null,
    descricao: "",
    quantidade: 1,
    precoUnitario: 0,
  };
}

export function ItensEditor({
  itens,
  onChange,
  servicos,
  pecas,
}: {
  itens: ItemDraft[];
  onChange: (itens: ItemDraft[]) => void;
  servicos: ServicoOption[];
  pecas: PecaOption[];
}) {
  function update(key: string, patch: Partial<ItemDraft>) {
    onChange(itens.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function remove(key: string) {
    onChange(itens.filter((i) => i.key !== key));
  }

  function handleTipo(key: string, tipo: TipoItem) {
    update(key, { tipo, serviceId: null, partId: null });
  }

  function handleServico(key: string, serviceId: string) {
    const svc = servicos.find((s) => s.id === serviceId);
    update(key, {
      serviceId: serviceId || null,
      descricao: svc ? svc.nome : "",
      precoUnitario: svc ? svc.precoPadrao : 0,
    });
  }

  function handlePeca(key: string, partId: string) {
    const p = pecas.find((x) => x.id === partId);
    update(key, {
      partId: partId || null,
      descricao: p ? p.nome : "",
      precoUnitario: p ? p.precoVenda : 0,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {itens.map((item, idx) => {
        const subtotal = item.quantidade * item.precoUnitario;
        return (
          <div
            key={item.key}
            className="rounded-xl border border-border bg-surface/40 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <Badge variant={item.tipo === "SERVICO" ? "accent" : "info"}>
                {item.tipo === "SERVICO" ? (
                  <Wrench className="h-3 w-3" />
                ) : (
                  <Package className="h-3 w-3" />
                )}
                Item {idx + 1}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(item.key)}
                aria-label="Remover item"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Tipo</Label>
                <Select
                  density="sm"
                  value={item.tipo}
                  onChange={(e) => handleTipo(item.key, e.target.value as TipoItem)}
                >
                  <option value="SERVICO">Serviço</option>
                  <option value="PECA">Peça</option>
                </Select>
              </div>

              {item.tipo === "SERVICO" ? (
                <div>
                  <Label>Serviço do catálogo</Label>
                  <Select
                    density="sm"
                    value={item.serviceId ?? ""}
                    onChange={(e) => handleServico(item.key, e.target.value)}
                  >
                    <option value="">Item avulso...</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} — {formatBRL(s.precoPadrao)}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Peça do estoque</Label>
                  <Select
                    density="sm"
                    value={item.partId ?? ""}
                    onChange={(e) => handlePeca(item.key, e.target.value)}
                  >
                    <option value="">Item avulso...</option>
                    {pecas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.codigoInterno}) — {formatBRL(p.precoVenda)}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="sm:col-span-2">
                <Label required>Descrição</Label>
                <Input
                  density="sm"
                  value={item.descricao}
                  onChange={(e) => update(item.key, { descricao: e.target.value })}
                  placeholder="Descrição do item"
                />
              </div>

              <div>
                <Label>Quantidade</Label>
                <Input
                  density="sm"
                  type="number"
                  min={1}
                  step={1}
                  value={item.quantidade}
                  onChange={(e) =>
                    update(item.key, {
                      quantidade: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>

              <div>
                <Label>Preço unitário (R$)</Label>
                <Input
                  density="sm"
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.precoUnitario}
                  onChange={(e) =>
                    update(item.key, {
                      precoUnitario: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-2 text-right text-sm text-muted">
              Subtotal:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatBRL(subtotal)}
              </span>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...itens, novoItemDraft()])}
      >
        <Plus className="h-4 w-4" />
        Adicionar item
      </Button>
    </div>
  );
}
