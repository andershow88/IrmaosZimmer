import Link from "next/link";
import { CheckCircle2, CreditCard, Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type { PagamentoPendente, ContaPagarItem } from "@/server/dashboard";

export function PagamentosPendentesList({
  itens,
}: {
  itens: PagamentoPendente[];
}) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nenhum pagamento pendente"
        message="Todos os recebimentos estão em dia."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((p) => {
        const conteudo = (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {p.clienteNome}
                </p>
                <p className="text-xs text-muted">
                  {p.osNumero ? `OS ${p.osNumero}` : "Sem OS"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge kind="pagamento" status={p.status} />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatBRL(p.saldo)}
              </span>
            </div>
          </div>
        );
        return (
          <li key={p.id} className="py-2.5 first:pt-0 last:pb-0">
            <Link
              href={`/painel/pagamentos/${p.id}`}
              className="block rounded-lg px-1 -mx-1 transition hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {conteudo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ContasAPagarList({ itens }: { itens: ContaPagarItem[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sem contas a vencer"
        message="Nenhuma conta a pagar nos próximos 7 dias."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {c.descricao}
            </p>
            <p className="truncate text-xs text-muted">
              {c.fornecedor ? `${c.fornecedor} · ` : ""}
              {formatDateBR(c.vencimento)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {c.vencida && <Badge variant="danger">vencida</Badge>}
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatBRL(c.valor)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
