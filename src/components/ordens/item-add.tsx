"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/utils";
import { addServicoItem, addPecaItem } from "@/server/ordens";

export type ServicoOption = {
  id: string;
  nome: string;
  precoPadrao: number;
};

export type PecaOption = {
  id: string;
  nome: string;
  codigoInterno: string;
  precoVenda: number;
  quantidade: number;
};

export function ItemAdd({
  serviceOrderId,
  servicos,
  pecas,
  disabled,
}: {
  serviceOrderId: string;
  servicos: ServicoOption[];
  pecas: PecaOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState("");
  const [servicoQtd, setServicoQtd] = useState(1);
  const [partId, setPartId] = useState("");
  const [pecaQtd, setPecaQtd] = useState(1);

  const pecaSelecionada = pecas.find((p) => p.id === partId);

  function addServico() {
    setError(null);
    if (!serviceId) {
      setError("Selecione um serviço.");
      return;
    }
    const fd = new FormData();
    fd.set("serviceId", serviceId);
    fd.set("quantidade", String(servicoQtd));
    startTransition(async () => {
      const res = await addServicoItem(serviceOrderId, fd);
      if (res.ok) {
        setServiceId("");
        setServicoQtd(1);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao adicionar serviço.");
      }
    });
  }

  function addPeca() {
    setError(null);
    if (!partId) {
      setError("Selecione uma peça.");
      return;
    }
    const fd = new FormData();
    fd.set("partId", partId);
    fd.set("quantidade", String(pecaQtd));
    startTransition(async () => {
      const res = await addPecaItem(serviceOrderId, fd);
      if (res.ok) {
        setPartId("");
        setPecaQtd(1);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao adicionar peça.");
      }
    });
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted">
        Itens não podem ser alterados nesta etapa da OS.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Serviço */}
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wrench className="h-4 w-4 text-accent" />
          Adicionar serviço do catálogo
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="serviceId">Serviço</Label>
            <Select
              id="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — {formatBRL(s.precoPadrao)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-28">
            <Label htmlFor="servicoQtd">Qtd.</Label>
            <Input
              id="servicoQtd"
              type="number"
              min={1}
              value={servicoQtd}
              onChange={(e) => setServicoQtd(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <Button type="button" onClick={addServico} disabled={pending}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Peça */}
      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="h-4 w-4 text-accent" />
          Adicionar peça do estoque
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="partId">Peça</Label>
            <Select
              id="partId"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {pecas.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantidade <= 0}>
                  {p.nome} ({p.codigoInterno}) — {formatBRL(p.precoVenda)} ·{" "}
                  {p.quantidade} em estoque
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-28">
            <Label htmlFor="pecaQtd">Qtd.</Label>
            <Input
              id="pecaQtd"
              type="number"
              min={1}
              max={pecaSelecionada?.quantidade ?? undefined}
              value={pecaQtd}
              onChange={(e) => setPecaQtd(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <Button
            type="button"
            onClick={addPeca}
            disabled={pending || (pecaSelecionada?.quantidade ?? 0) <= 0}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {pecaSelecionada && pecaQtd > pecaSelecionada.quantidade && (
          <p className="mt-2 text-xs font-medium text-danger">
            Estoque insuficiente — disponível: {pecaSelecionada.quantidade} un.
          </p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
