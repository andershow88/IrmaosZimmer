"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, PackageSearch, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
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
 * Próximos status permitidos — IGUAL ao fluxo de @/components/ordens/status-actions
 * (não alteramos a lógica de transição, apenas a apresentação para o mecânico).
 * Cancelamento e entrega ficam de fora do Modo Mecânico (atribuições de balcão).
 */
const NEXT: Record<StatusOS, StatusOS[]> = {
  ABERTA: ["AGUARDANDO_DIAGNOSTICO"],
  AGUARDANDO_DIAGNOSTICO: ["AGUARDANDO_APROVACAO"],
  AGUARDANDO_APROVACAO: [],
  APROVADA: ["EM_EXECUCAO"],
  EM_EXECUCAO: ["AGUARDANDO_PECAS", "CONCLUIDA"],
  AGUARDANDO_PECAS: ["EM_EXECUCAO"],
  CONCLUIDA: [],
  ENTREGUE: [],
  CANCELADA: [],
};

const META: Record<string, { icon: LucideIcon; variant: "primary" | "secondary" }> = {
  CONCLUIDA: { icon: CheckCircle2, variant: "primary" },
  AGUARDANDO_PECAS: { icon: PackageSearch, variant: "secondary" },
  EM_EXECUCAO: { icon: Wrench, variant: "primary" },
};

export function StatusControl({
  serviceOrderId,
  status,
}: {
  serviceOrderId: string;
  status: StatusOS;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<StatusOS | null>(null);

  const proximos = NEXT[status] ?? [];

  function aplicar(novo: StatusOS) {
    startTransition(async () => {
      const res = await updateStatus(serviceOrderId, novo);
      setConfirm(null);
      if (res.ok) {
        toast({
          title: `Status: ${LABELS[novo]}`,
          variant: "success",
        });
        router.refresh();
      } else {
        toast({
          title: "Não foi possível alterar o status",
          description: res.error ?? "Tente novamente.",
          variant: "error",
        });
      }
    });
  }

  if (proximos.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhuma ação de status disponível para você nesta etapa.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {proximos.map((p) => {
        const meta = META[p] ?? { icon: ArrowRight, variant: "secondary" as const };
        const Icon = meta.icon;
        const concluir = p === "CONCLUIDA";
        return (
          <Button
            key={p}
            type="button"
            size="lg"
            variant={meta.variant}
            disabled={pending}
            onClick={() => (concluir ? setConfirm(p) : aplicar(p))}
            className="min-h-12 w-full justify-start text-base"
          >
            <Icon className="h-5 w-5" />
            {concluir ? "Marcar como concluído" : LABELS[p]}
          </Button>
        );
      })}

      <ConfirmDialog
        open={confirm !== null}
        title="Concluir trabalho"
        description="Confirma que o serviço foi finalizado? A OS irá para 'Concluída'."
        confirmLabel="Concluir"
        variant="primary"
        loading={pending}
        onConfirm={() => confirm && aplicar(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
