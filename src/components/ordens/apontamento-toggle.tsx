"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { iniciarApontamento, pararApontamento } from "@/server/horas";

/**
 * Botão Iniciar/Parar do cronômetro de horas da OS.
 * Quando há um apontamento aberto do mecânico logado, mostra "Parar";
 * caso contrário mostra "Iniciar".
 */
export function ApontamentoToggle({
  serviceOrderId,
  apontamentoAbertoId,
  desabilitado = false,
}: {
  serviceOrderId: string;
  apontamentoAbertoId: string | null;
  desabilitado?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const aberto = apontamentoAbertoId != null;

  function acionar() {
    setError(null);
    startTransition(async () => {
      const res = aberto
        ? await pararApontamento(apontamentoAbertoId!)
        : await iniciarApontamento(serviceOrderId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao registrar apontamento.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant={aberto ? "danger" : "primary"}
        disabled={pending || desabilitado}
        onClick={acionar}
      >
        {aberto ? (
          <>
            <Square className="h-4 w-4" />
            Parar
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Iniciar
          </>
        )}
      </Button>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
