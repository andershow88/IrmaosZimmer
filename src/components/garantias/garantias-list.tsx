import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateBR } from "@/lib/utils";
import { GarantiaDelete } from "@/components/garantias/garantia-delete";

export type GarantiaItem = {
  id: string;
  descricao: string;
  validadeAte: Date | null;
  observacoes: string | null;
  createdAt: Date;
};

/** Estado de validade da garantia, para exibir o badge correto. */
function statusValidade(validadeAte: Date | null): {
  label: string;
  variant: "default" | "success" | "warning" | "danger";
} {
  if (!validadeAte) {
    return { label: "Sem prazo", variant: "default" };
  }
  const hoje = new Date();
  const ms = validadeAte.getTime() - hoje.getTime();
  const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return { label: "Expirada", variant: "danger" };
  }
  if (dias <= 30) {
    return {
      label: dias === 0 ? "Expira hoje" : `Expira em ${dias} dia(s)`,
      variant: "warning",
    };
  }
  return { label: `Válida até ${formatDateBR(validadeAte)}`, variant: "success" };
}

/** Lista de garantias de uma OS, com badge de validade e exclusão. */
export function GarantiasList({ garantias }: { garantias: GarantiaItem[] }) {
  if (garantias.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nenhuma garantia"
        message="Esta ordem de serviço ainda não possui garantias cadastradas."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {garantias.map((g) => {
        const st = statusValidade(g.validadeAte);
        return (
          <li
            key={g.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/40 p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{g.descricao}</p>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              {g.observacoes && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                  {g.observacoes}
                </p>
              )}
              <p className="mt-1 text-xs text-subtle">
                Cadastrada em {formatDateBR(g.createdAt)}
                {g.validadeAte
                  ? ` · validade ${formatDateBR(g.validadeAte)}`
                  : ""}
              </p>
            </div>
            <GarantiaDelete garantiaId={g.id} descricao={g.descricao} />
          </li>
        );
      })}
    </ul>
  );
}
