"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  AlertCircle,
  Lock,
  Trash2,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatBRL, formatDateTimeBR } from "@/lib/utils";
import {
  abrirCaixa,
  fecharCaixa,
  registrarMovimentoCaixa,
  excluirMovimentoCaixa,
  type ActionResult,
} from "@/server/financeiro";

export type MovimentoRow = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  formaPagamento: string | null;
  createdAt: string; // ISO
};

export type SessaoAberta = {
  id: string;
  abertura: string; // ISO
  valorAbertura: number;
  saldoAtual: number;
  totalEntradas: number;
  totalSaidas: number;
  movimentos: MovimentoRow[];
};

const FORMAS: { value: string; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "BOLETO", label: "Boleto" },
  { value: "OUTRO", label: "Outro" },
];

// ---------------------------------------------------------------------------
// Abertura de caixa
// ---------------------------------------------------------------------------

export function AbrirCaixaCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res: ActionResult = await abrirCaixa(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-accent" />
            <p className="text-sm font-semibold text-foreground">Nenhum caixa aberto</p>
          </div>
          <p className="text-sm text-muted">
            Informe o valor inicial em caixa (troco/fundo de caixa) para iniciar a sessão.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-w-xs">
            <Label htmlFor="valorAbertura" required>
              Valor de abertura (R$)
            </Label>
            <Input
              id="valorAbertura"
              name="valorAbertura"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              defaultValue="0"
              required
            />
          </div>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={pending}>
            <Wallet className="h-4 w-4" />
            {pending ? "Abrindo…" : "Abrir caixa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sessão aberta (movimentos + fechamento)
// ---------------------------------------------------------------------------

function MovimentoForm({ cashSessionId }: { cashSessionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    startTransition(async () => {
      const res: ActionResult = await registrarMovimentoCaixa(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formEl.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="cashSessionId" value={cashSessionId} />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="mov-tipo" required>
            Tipo
          </Label>
          <Select id="mov-tipo" name="tipo" defaultValue="ENTRADA" required>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="mov-valor" required>
            Valor (R$)
          </Label>
          <Input
            id="mov-valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="mov-forma">Forma</Label>
          <Select id="mov-forma" name="formaPagamento" defaultValue="">
            <option value="">—</option>
            {FORMAS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="mov-descricao">Descrição</Label>
          <Input id="mov-descricao" name="descricao" placeholder="Opcional" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          <PlusCircle className="h-4 w-4" />
          {pending ? "Lançando…" : "Lançar movimento"}
        </Button>
      </div>
    </form>
  );
}

export function CaixaAbertaPanel({ sessao }: { sessao: SessaoAberta }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmarFechar, setConfirmarFechar] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState<MovimentoRow | null>(null);

  function fechar() {
    const form = new FormData();
    form.set("id", sessao.id);
    startTransition(async () => {
      const res = await fecharCaixa(form);
      setConfirmarFechar(false);
      if (res.ok) router.refresh();
    });
  }

  function excluirMovimento() {
    if (!confirmarExcluir) return;
    const id = confirmarExcluir.id;
    startTransition(async () => {
      await excluirMovimentoCaixa(id);
      setConfirmarExcluir(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-success" />
              <p className="text-sm font-semibold text-foreground">Caixa aberto</p>
              <Badge variant="success">Aberto</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              Aberto em {formatDateTimeBR(sessao.abertura)} · Fundo de caixa{" "}
              {formatBRL(sessao.valorAbertura)}
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmarFechar(true)} disabled={pending}>
            <Lock className="h-4 w-4" />
            Fechar caixa
          </Button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResumoCaixa
          label="Entradas"
          value={sessao.totalEntradas}
          icon={ArrowDownCircle}
          tone="success"
        />
        <ResumoCaixa
          label="Saídas"
          value={sessao.totalSaidas}
          icon={ArrowUpCircle}
          tone="danger"
        />
        <ResumoCaixa
          label="Saldo atual"
          value={sessao.saldoAtual}
          icon={Wallet}
          tone="accent"
        />
      </div>

      <Card>
        <CardBody>
          <MovimentoForm cashSessionId={sessao.id} />
        </CardBody>
      </Card>

      {sessao.movimentos.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Data/Hora</TH>
              <TH>Tipo</TH>
              <TH>Descrição</TH>
              <TH>Forma</TH>
              <TH className="text-right">Valor</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {sessao.movimentos.map((m) => {
              const entrada = m.tipo === "ENTRADA";
              return (
                <TR key={m.id}>
                  <TD className="text-sm text-muted">{formatDateTimeBR(m.createdAt)}</TD>
                  <TD>
                    <Badge variant={entrada ? "success" : "danger"}>
                      {entrada ? "Entrada" : "Saída"}
                    </Badge>
                  </TD>
                  <TD className="text-sm">{m.descricao ?? "—"}</TD>
                  <TD className="text-sm text-muted">{m.formaPagamento ?? "—"}</TD>
                  <TD
                    className={
                      "text-right tabular-nums font-medium " +
                      (entrada ? "text-success" : "text-danger")
                    }
                  >
                    {entrada ? "+" : "−"} {formatBRL(m.valor)}
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir movimento"
                      aria-label="Excluir movimento"
                      onClick={() => setConfirmarExcluir(m)}
                      className="text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmarFechar}
        title="Fechar o caixa?"
        description={`O saldo de fechamento será ${formatBRL(
          sessao.saldoAtual
        )}. Após fechar, não será possível lançar novos movimentos nesta sessão.`}
        variant="primary"
        confirmLabel={pending ? "Fechando…" : "Fechar caixa"}
        loading={pending}
        onConfirm={fechar}
        onCancel={() => setConfirmarFechar(false)}
      />

      <ConfirmDialog
        open={confirmarExcluir !== null}
        title="Excluir movimento?"
        description="O movimento será removido e o saldo recalculado."
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        loading={pending}
        onConfirm={excluirMovimento}
        onCancel={() => setConfirmarExcluir(null)}
      />

      {pending && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2 text-xs text-muted shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processando…
        </div>
      )}
    </div>
  );
}

function ResumoCaixa({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Wallet;
  tone: "success" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent-soft text-accent",
  };
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm">
      <div className={"grid h-10 w-10 shrink-0 place-items-center rounded-xl " + tones[tone]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
          {formatBRL(value)}
        </p>
      </div>
    </div>
  );
}
