"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle } from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { DateField } from "@/components/ui/date-field";
import { toast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/utils";
import type { FormaPagamento, StatusPagamento } from "@prisma/client";
import { FORMA_OPTIONS, deriveStatus, type ActionResult } from "./constants";
import { registrarPagamento, updatePagamento } from "@/server/pagamentos";

export type OsOption = {
  id: string;
  numero: string;
  cliente: string;
  total: number;
};

type Initial = {
  id: string;
  serviceOrderId: string;
  valorTotal: number;
  valorPago: number;
  forma: FormaPagamento;
  dataPagamento: string | null;
  observacoes: string | null;
};

function statusLabel(s: StatusPagamento): string {
  return s;
}

export function PagamentoForm({
  ordens,
  initial,
}: {
  ordens: OsOption[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceOrderId, setServiceOrderId] = useState(initial?.serviceOrderId ?? "");
  const [valorTotal, setValorTotal] = useState<string>(
    initial ? String(initial.valorTotal) : ""
  );
  const [valorPago, setValorPago] = useState<string>(
    initial ? String(initial.valorPago) : ""
  );

  const total = Number(valorTotal) || 0;
  const pago = Number(valorPago) || 0;
  const saldo = Math.max(total - pago, 0);
  const derivedStatus = useMemo(() => deriveStatus(total, pago), [total, pago]);

  function onSelectOs(id: string) {
    setServiceOrderId(id);
    const os = ordens.find((o) => o.id === id);
    // Preenche valorTotal com o total da OS (somente ao criar / se vazio).
    if (os && (!initial || valorTotal === "")) {
      setValorTotal(String(os.total));
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res: ActionResult = initial
        ? await updatePagamento(form)
        : await registrarPagamento(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast({
        title: initial ? "Pagamento atualizado" : "Pagamento registrado",
        variant: "success",
      });
      router.push(`/painel/pagamentos/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Card>
        <CardBody className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label htmlFor="serviceOrderId" required>
              Ordem de serviço
            </Label>
            <Select
              id="serviceOrderId"
              name="serviceOrderId"
              value={serviceOrderId}
              onChange={(e) => onSelectOs(e.target.value)}
              required
            >
              <option value="">Selecione a OS…</option>
              {ordens.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.numero} — {o.cliente} ({formatBRL(o.total)})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="valorTotal" required>
                Valor total (R$)
              </Label>
              <Input
                id="valorTotal"
                name="valorTotal"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="valorPago" required>
                Valor pago (R$)
              </Label>
              <Input
                id="valorPago"
                name="valorPago"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="forma" required>
                Forma de pagamento
              </Label>
              <Select
                id="forma"
                name="forma"
                defaultValue={initial?.forma ?? ""}
                required
              >
                <option value="">Selecione…</option>
                {FORMA_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="dataPagamento">Data do pagamento</Label>
              <DateField
                id="dataPagamento"
                name="dataPagamento"
                defaultValue={initial?.dataPagamento ?? ""}
              />
            </div>
          </div>

          {initial && (
            <div>
              <Label htmlFor="statusManual">Forçar status (opcional)</Label>
              <Select id="statusManual" name="statusManual" defaultValue="">
                <option value="">Automático ({statusLabel(derivedStatus)})</option>
                <option value="VENCIDO">Vencido</option>
                <option value="CANCELADO">Cancelado</option>
              </Select>
              <p className="mt-1 text-xs text-muted">
                Em branco, o status é calculado a partir dos valores.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={initial?.observacoes ?? ""}
              placeholder="Detalhes do pagamento, parcelamento, etc."
            />
          </div>

          {/* Resumo dinâmico */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface/40 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Pago</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                {formatBRL(pago)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Saldo</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                {formatBRL(saldo)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Status</p>
              <div className="mt-1.5">
                <StatusBadge kind="pagamento" status={derivedStatus} />
              </div>
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando…" : initial ? "Salvar alterações" : "Registrar pagamento"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
