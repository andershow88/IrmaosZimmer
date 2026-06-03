"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Car,
  UserX,
  XCircle,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { updateStatusAgendamento } from "@/server/agenda";
import type { StatusAgendamento } from "@prisma/client";

type ActionKey = "CONFIRMAR" | "RECEBER" | "NAO_COMPARECEU" | "CANCELAR" | "CONCLUIR";

const ACTION_TO_STATUS: Record<ActionKey, StatusAgendamento> = {
  CONFIRMAR: "CONFIRMADO",
  RECEBER: "VEICULO_RECEBIDO",
  NAO_COMPARECEU: "NAO_COMPARECEU",
  CANCELAR: "CANCELADO",
  CONCLUIR: "CONCLUIDO",
};

/** Estados finais não permitem novas transições. */
const TERMINAIS: StatusAgendamento[] = ["CANCELADO", "CONCLUIDO", "NAO_COMPARECEU"];

export interface StatusActionsProps {
  agendamentoId: string;
  status: StatusAgendamento;
}

export function StatusActions({ agendamentoId, status }: StatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<ActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminal = TERMINAIS.includes(status);

  function run(action: ActionKey) {
    setError(null);
    startTransition(async () => {
      const res = await updateStatusAgendamento(agendamentoId, ACTION_TO_STATUS[action]);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível atualizar o status.");
        return;
      }
      router.refresh();
    });
  }

  function handle(action: ActionKey) {
    // Ações destrutivas pedem confirmação.
    if (action === "CANCELAR" || action === "NAO_COMPARECEU") {
      setConfirm(action);
      return;
    }
    run(action);
  }

  if (terminal) {
    return (
      <p className="text-sm text-muted">
        Este agendamento está finalizado e não permite novas ações de status.
      </p>
    );
  }

  // Define quais ações fazem sentido por status atual.
  const podeConfirmar = status === "AGENDADO";
  const podeReceber = status === "AGENDADO" || status === "CONFIRMADO";
  const podeConcluir = status === "VEICULO_RECEBIDO";
  const podeNaoCompareceu = status === "AGENDADO" || status === "CONFIRMADO";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {podeConfirmar && (
          <Button variant="secondary" onClick={() => handle("CONFIRMAR")} disabled={pending}>
            <CheckCircle2 className="h-4 w-4" />
            Confirmar
          </Button>
        )}
        {podeReceber && (
          <Button variant="secondary" onClick={() => handle("RECEBER")} disabled={pending}>
            <Car className="h-4 w-4" />
            Veículo recebido
          </Button>
        )}
        {podeConcluir && (
          <Button onClick={() => handle("CONCLUIR")} disabled={pending}>
            <ClipboardCheck className="h-4 w-4" />
            Concluir
          </Button>
        )}
        {podeNaoCompareceu && (
          <Button variant="outline" onClick={() => handle("NAO_COMPARECEU")} disabled={pending}>
            <UserX className="h-4 w-4" />
            Não compareceu
          </Button>
        )}
        <Button variant="danger" onClick={() => handle("CANCELAR")} disabled={pending}>
          <XCircle className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirm === "CANCELAR"}
        title="Cancelar agendamento?"
        description="O agendamento será marcado como cancelado. Esta ação não pode ser desfeita."
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        variant="danger"
        loading={pending}
        onConfirm={() => {
          setConfirm(null);
          run("CANCELAR");
        }}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === "NAO_COMPARECEU"}
        title="Marcar como não compareceu?"
        description="O cliente será registrado como ausente neste agendamento."
        confirmLabel="Marcar ausência"
        cancelLabel="Voltar"
        variant="danger"
        loading={pending}
        onConfirm={() => {
          setConfirm(null);
          run("NAO_COMPARECEU");
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
