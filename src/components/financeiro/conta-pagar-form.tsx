"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CurrencyField } from "@/components/ui/currency-field";
import { DateField } from "@/components/ui/date-field";
import { toast } from "@/components/ui/toast";
import { criarContaPagar, atualizarContaPagar, type ActionResult } from "@/server/financeiro";

export type SupplierOption = { id: string; nome: string };

export type ContaPagarInitial = {
  id: string;
  descricao: string;
  supplierId: string | null;
  valor: number;
  vencimento: string; // yyyy-mm-dd
};

export function ContaPagarForm({
  fornecedores,
  initial,
  onDone,
  onCancel,
}: {
  fornecedores: SupplierOption[];
  initial?: ContaPagarInitial;
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
        ? await atualizarContaPagar(form)
        : await criarContaPagar(form);
      if (!res.ok) {
        setError(res.error);
        toast({ title: res.error, variant: "error" });
        return;
      }
      toast({
        title: initial ? "Conta a pagar atualizada" : "Conta a pagar criada",
        variant: "success",
      });
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
        <Label htmlFor="cp-descricao" required>
          Descrição
        </Label>
        <Input
          id="cp-descricao"
          name="descricao"
          defaultValue={initial?.descricao ?? ""}
          placeholder="Ex.: Compra de peças, aluguel, energia…"
          required
        />
      </div>

      <div>
        <Label htmlFor="cp-supplier">Fornecedor (opcional)</Label>
        <Select id="cp-supplier" name="supplierId" defaultValue={initial?.supplierId ?? ""}>
          <option value="">Sem fornecedor</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cp-valor" required>
            Valor (R$)
          </Label>
          <CurrencyField
            id="cp-valor"
            name="valor"
            defaultValue={initial ? initial.valor : null}
            required
          />
        </div>
        <div>
          <Label htmlFor="cp-vencimento" required>
            Vencimento
          </Label>
          <DateField
            id="cp-vencimento"
            name="vencimento"
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
