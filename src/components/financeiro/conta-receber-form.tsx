"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/utils";
import {
  criarContaReceber,
  atualizarContaReceber,
  type ActionResult,
} from "@/server/financeiro";

export type CustomerOption = { id: string; nome: string };
export type OsOption = { id: string; numero: string; cliente: string; total: number };

export type ContaReceberInitial = {
  id: string;
  descricao: string;
  customerId: string | null;
  serviceOrderId: string | null;
  valor: number;
  vencimento: string; // yyyy-mm-dd
};

export function ContaReceberForm({
  clientes,
  ordens,
  initial,
  onDone,
  onCancel,
}: {
  clientes: CustomerOption[];
  ordens: OsOption[];
  initial?: ContaReceberInitial;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res: ActionResult = initial
        ? await atualizarContaReceber(form)
        : await criarContaReceber(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="cr-descricao" required>
          Descrição
        </Label>
        <Input
          id="cr-descricao"
          name="descricao"
          defaultValue={initial?.descricao ?? ""}
          placeholder="Ex.: Serviço prestado, parcela, etc."
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cr-customer">Cliente (opcional)</Label>
          <Select id="cr-customer" name="customerId" defaultValue={initial?.customerId ?? ""}>
            <option value="">Sem cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cr-os">Ordem de serviço (opcional)</Label>
          <Select id="cr-os" name="serviceOrderId" defaultValue={initial?.serviceOrderId ?? ""}>
            <option value="">Sem OS</option>
            {ordens.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero} — {o.cliente} ({formatBRL(o.total)})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cr-valor" required>
            Valor (R$)
          </Label>
          <Input
            id="cr-valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            defaultValue={initial ? String(initial.valor) : ""}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="cr-vencimento" required>
            Vencimento
          </Label>
          <Input
            id="cr-vencimento"
            name="vencimento"
            type="date"
            defaultValue={initial?.vencimento ?? ""}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Salvando…" : initial ? "Salvar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
