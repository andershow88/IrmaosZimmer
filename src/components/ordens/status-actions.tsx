"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast";
import { updateStatus } from "@/server/ordens";

type StatusOS =
  | "ABERTA"
  | "AGUARDANDO_DIAGNOSTICO"
  | "AGUARDANDO_APROVACAO"
  | "APROVADA"
  | "EM_EXECUCAO"
  | "AGUARDANDO_PECAS"
  | "CONCLUIDA"
  | "ENTREGUE"
  | "CANCELADA";

const LABELS: Record<StatusOS, string> = {
  ABERTA: "Aberta",
  AGUARDANDO_DIAGNOSTICO: "Aguardando diagnóstico",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADA: "Aprovada",
  EM_EXECUCAO: "Em execução",
  AGUARDANDO_PECAS: "Aguardando peças",
  CONCLUIDA: "Concluída",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

/**
 * Fluxo linear principal de status. Cada status aponta para o(s) próximo(s)
 * estado(s) permitido(s). Espelha a regra de negócio do servidor — apenas
 * EXIBE os próximos status válidos (a validação final é do servidor).
 */
const NEXT: Record<StatusOS, StatusOS[]> = {
  ABERTA: ["AGUARDANDO_DIAGNOSTICO"],
  AGUARDANDO_DIAGNOSTICO: ["AGUARDANDO_APROVACAO"],
  AGUARDANDO_APROVACAO: ["APROVADA"],
  APROVADA: ["EM_EXECUCAO"],
  EM_EXECUCAO: ["AGUARDANDO_PECAS", "CONCLUIDA"],
  AGUARDANDO_PECAS: ["EM_EXECUCAO"],
  CONCLUIDA: ["ENTREGUE"],
  ENTREGUE: [],
  CANCELADA: [],
};

/** Consequência (explicação) exibida antes de mudanças sensíveis. */
const CONSEQUENCIA: Partial<Record<StatusOS, string>> = {
  ENTREGUE:
    "Esta ação marca a OS como concluída e entregue ao cliente. Após a entrega, os itens, valores e horas não poderão mais ser alterados.",
  CONCLUIDA:
    "O serviço será marcado como concluído. Confirme que todos os itens e horas foram registrados antes de prosseguir.",
  CANCELADA:
    "A OS será cancelada. Esta ação encerra o atendimento e não poderá ser revertida pelo fluxo normal.",
  APROVADA:
    "Ao aprovar, a OS fica liberada para execução. Confirme que o orçamento foi acertado com o cliente.",
};

/** Itens de checklist exibidos na confirmação de ENTREGUE. */
const CHECKLIST_ENTREGUE = [
  "Todos os serviços e peças foram lançados",
  "As horas trabalhadas foram apontadas",
  "O pagamento foi registrado ou combinado",
  "O cliente foi avisado de que o veículo está pronto",
];

export function StatusActions({
  serviceOrderId,
  status,
  hasItems = true,
  hasPagamento = false,
  /** Layout compacto (botões menores) p/ uso na action bar. */
  compact = false,
}: {
  serviceOrderId: string;
  status: StatusOS;
  /** A OS possui itens lançados? Usado para avisar antes de concluir/entregar. */
  hasItems?: boolean;
  /** A OS possui algum pagamento registrado? */
  hasPagamento?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<StatusOS | null>(null);

  const proximos = NEXT[status] ?? [];
  const finalizada = status === "ENTREGUE" || status === "CANCELADA";

  function aplicar(novo: StatusOS) {
    setError(null);
    startTransition(async () => {
      const res = await updateStatus(serviceOrderId, novo);
      if (res.ok) {
        setConfirm(null);
        toast({
          title: `Status alterado para "${LABELS[novo]}"`,
          variant: "success",
        });
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao atualizar status.");
        setConfirm(null);
        toast({
          title: "Erro ao atualizar status",
          description: res.error,
          variant: "error",
        });
      }
    });
  }

  const size = compact ? "sm" : "sm";

  if (finalizada) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Status:</span>
        <StatusBadge kind="os" status={status} />
        <span className="text-sm text-muted">— OS encerrada.</span>
      </div>
    );
  }

  // Avisos contextuais (info faltando) para os próximos passos sensíveis.
  const avisoFaltaInfo =
    (status === "EM_EXECUCAO" || status === "APROVADA") && !hasItems
      ? "Atenção: esta OS ainda não tem itens lançados."
      : status === "CONCLUIDA" && !hasPagamento
        ? "Atenção: nenhum pagamento foi registrado nesta OS."
        : null;

  // Itens de consequência exibidos no ConfirmDialog.
  const consequenceItems =
    confirm === "ENTREGUE"
      ? CHECKLIST_ENTREGUE
      : confirm === "CONCLUIDA" && !hasItems
        ? ["A OS não possui itens lançados."]
        : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {proximos.map((p) => (
          <Button
            key={p}
            size={size}
            variant="primary"
            disabled={pending}
            onClick={() => setConfirm(p)}
          >
            <ArrowRight className="h-4 w-4" />
            {LABELS[p]}
          </Button>
        ))}
        <Button
          size={size}
          variant="danger"
          disabled={pending}
          onClick={() => setConfirm("CANCELADA")}
        >
          <XCircle className="h-4 w-4" />
          Cancelar OS
        </Button>
      </div>

      {avisoFaltaInfo && !compact && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
          <Info className="h-3.5 w-3.5" />
          {avisoFaltaInfo}
        </p>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "ENTREGUE"
            ? "Marcar OS como entregue"
            : confirm === "CANCELADA"
              ? "Cancelar ordem de serviço"
              : "Alterar status da OS"
        }
        description={
          confirm
            ? (CONSEQUENCIA[confirm] ??
              `Deseja realmente alterar o status para "${LABELS[confirm]}"?`)
            : ""
        }
        consequenceItems={
          confirm === "ENTREGUE"
            ? CHECKLIST_ENTREGUE
            : consequenceItems
        }
        confirmLabel={
          confirm === "ENTREGUE"
            ? "Confirmar entrega"
            : confirm === "CANCELADA"
              ? "Cancelar OS"
              : "Alterar"
        }
        variant={
          confirm === "CANCELADA" || confirm === "ENTREGUE" ? "danger" : "primary"
        }
        loading={pending}
        onConfirm={() => confirm && aplicar(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
