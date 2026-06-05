import { Wrench, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { OficinaDetalheItem } from "@/server/oficina";

/**
 * Lista enxuta (sem valores) de serviços a executar e peças necessárias.
 * SEM informações financeiras — visão de bancada.
 */
export function ItensTrabalho({
  servicos,
  pecas,
}: {
  servicos: OficinaDetalheItem[];
  pecas: OficinaDetalheItem[];
}) {
  if (servicos.length === 0 && pecas.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Sem itens"
        message="Nenhum serviço ou peça lançado nesta OS ainda."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Secao
        titulo="Serviços a executar"
        icon={Wrench}
        itens={servicos}
        vazio="Nenhum serviço lançado."
      />
      <Secao
        titulo="Peças necessárias"
        icon={Package}
        itens={pecas}
        vazio="Nenhuma peça lançada."
      />
    </div>
  );
}

function Secao({
  titulo,
  icon: Icon,
  itens,
  vazio,
}: {
  titulo: string;
  icon: typeof Wrench;
  itens: OficinaDetalheItem[];
  vazio: string;
}) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-accent" />
        {titulo}
      </h4>
      {itens.length === 0 ? (
        <p className="text-sm text-muted">{vazio}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {itens.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 p-3 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-foreground">
                {i.descricao}
              </span>
              <span className="shrink-0 rounded-lg bg-surface px-2 py-0.5 font-mono text-xs font-semibold text-muted">
                {i.quantidade}x
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
