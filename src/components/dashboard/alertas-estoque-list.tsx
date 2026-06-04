import Link from "next/link";
import { PackageCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils";
import type { AlertaEstoque } from "@/server/dashboard";

export function AlertasEstoqueList({ itens }: { itens: AlertaEstoque[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={PackageCheck}
        title="Estoque em dia"
        message="Nenhuma peça está abaixo do estoque mínimo."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {itens.map((p) => {
        const zerado = p.quantidade <= 0;
        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <Link
                  href="/painel/estoque"
                  className="block truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {p.nome}
                </Link>
                <p className="text-xs text-muted">Cód. {p.codigoInterno}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant={zerado ? "danger" : "warning"}>
                {formatNumber(p.quantidade)} / {formatNumber(p.estoqueMinimo)}
              </Badge>
              <p className="mt-0.5 text-[11px] text-muted">
                {zerado ? "Sem estoque" : "Abaixo do mínimo"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
