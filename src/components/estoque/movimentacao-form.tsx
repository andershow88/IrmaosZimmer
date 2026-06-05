"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";
import { registrarMovimentacao } from "@/server/estoque";

export interface PecaOption {
  id: string;
  nome: string;
  codigoInterno: string;
  quantidade: number;
}

interface MovimentacaoFormProps {
  pecas: PecaOption[];
}

type Tipo = "ENTRADA" | "SAIDA" | "AJUSTE";

const TIPO_HINT: Record<Tipo, string> = {
  ENTRADA: "Soma a quantidade ao estoque atual.",
  SAIDA: "Subtrai a quantidade do estoque atual.",
  AJUSTE: "Define o saldo absoluto da peça (correção de inventário).",
};

export function MovimentacaoForm({ pecas }: MovimentacaoFormProps) {
  const router = useRouter();
  const [partId, setPartId] = useState("");
  const [tipo, setTipo] = useState<Tipo>("ENTRADA");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const pecaSelecionada = useMemo(
    () => pecas.find((p) => p.id === partId) ?? null,
    [pecas, partId]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registrarMovimentacao(formData);
      if (result.ok) {
        toast({ title: "Movimentação registrada", variant: "success" });
        setPartId("");
        setTipo("ENTRADA");
        setFormKey((k) => k + 1);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (pecas.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-muted">
            Cadastre uma peça antes de registrar movimentações de estoque.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar movimentação</CardTitle>
      </CardHeader>
      <CardBody>
        <form key={formKey} onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="partId" required>
              Peça
            </Label>
            <Select
              id="partId"
              name="partId"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              required
            >
              <option value="">Selecione uma peça...</option>
              {pecas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.codigoInterno}) — saldo {p.quantidade}
                </option>
              ))}
            </Select>
            {pecaSelecionada && (
              <p className="mt-1 text-xs text-muted">
                Saldo atual: {formatNumber(pecaSelecionada.quantidade)} un.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo" required>
                Tipo
              </Label>
              <Select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                required
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="AJUSTE">Ajuste</option>
              </Select>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                {tipo === "ENTRADA" && <ArrowDownToLine className="h-3.5 w-3.5" />}
                {tipo === "SAIDA" && <ArrowUpFromLine className="h-3.5 w-3.5" />}
                {tipo === "AJUSTE" && <SlidersHorizontal className="h-3.5 w-3.5" />}
                {TIPO_HINT[tipo]}
              </p>
            </div>

            <div>
              <Label htmlFor="quantidade" required>
                {tipo === "AJUSTE" ? "Novo saldo" : "Quantidade"}
              </Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                step="1"
                min={tipo === "AJUSTE" ? "0" : "1"}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              name="motivo"
              placeholder="Ex.: Compra do fornecedor, uso na OS, correção de inventário..."
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              <Plus className="h-4 w-4" />
              {pending ? "Registrando..." : "Registrar movimentação"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
