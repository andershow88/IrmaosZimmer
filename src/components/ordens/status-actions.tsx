"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
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
 * estado(s) permitido(s). CANCELADA é tratada à parte.
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

export function StatusActions({
  serviceOrderId,
  status,
}: {
  serviceOrderId: string;
  status: StatusOS;
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
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao atualizar status.");
        setConfirm(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Status atual:</span>
        <StatusBadge kind="os" status={status} />
      </div>

      {!finalizada && (
        <div className="flex flex-wrap gap-2">
          {proximos.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => setConfirm(p)}
            >
              <ArrowRight className="h-4 w-4" />
              {LABELS[p]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => setConfirm("CANCELADA")}
          >
            <XCircle className="h-4 w-4" />
            Cancelar OS
          </Button>
        </div>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <ConfirmDialog
        open={confirm !== null}
        title="Alterar status da OS"
        description={
          confirm
            ? `Deseja realmente alterar o status para "${LABELS[confirm]}"?`
            : ""
        }
        confirmLabel="Alterar"
        variant={confirm === "CANCELADA" ? "danger" : "primary"}
        loading={pending}
        onConfirm={() => confirm && aplicar(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
