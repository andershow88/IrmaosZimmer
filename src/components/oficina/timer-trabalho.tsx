"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDuracao } from "@/lib/horas";
import { iniciarApontamento, pararApontamento } from "@/server/horas";

/**
 * Timer grande (touch-first) de Iniciar/Parar trabalho para o mecânico.
 * Reusa as Server Actions de apontamento (NÃO altera lógica de horas).
 *
 * - Quando há apontamento aberto, mostra o tempo decorrido ao vivo + "Parar".
 * - Caso contrário mostra o total já executado nesta OS + "Iniciar".
 */
export function TimerTrabalho({
  serviceOrderId,
  apontamentoAbertoId,
  inicioAberto,
  minutosExecutados,
  desabilitado = false,
}: {
  serviceOrderId: string;
  apontamentoAbertoId: string | null;
  /** Início (epoch ms) do apontamento aberto, se houver. */
  inicioAberto: number | null;
  /** Minutos já contabilizados (inclui o decorrido do aberto no carregamento). */
  minutosExecutados: number;
  desabilitado?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [agora, setAgora] = useState(0);

  const aberto = apontamentoAbertoId != null;
  // O cronômetro ao vivo só roda após a montagem no cliente: evita usar o
  // relógio do servidor no SSR (que difere do cliente por skew) e qualquer
  // flash de tempo incorreto antes da hidratação.
  const live = aberto && mounted && inicioAberto != null;

  // Atualiza o relógio a cada segundo apenas quando há um apontamento aberto.
  useEffect(() => {
    setMounted(true);
    if (!aberto) return;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [aberto]);

  // Decorrido (em segundos) do apontamento aberto, para o cronômetro ao vivo.
  const decorridoSeg =
    aberto && mounted && inicioAberto != null
      ? Math.max(0, Math.floor((agora - inicioAberto) / 1000))
      : 0;

  const hh = String(Math.floor(decorridoSeg / 3600)).padStart(2, "0");
  const mm = String(Math.floor((decorridoSeg % 3600) / 60)).padStart(2, "0");
  const ss = String(decorridoSeg % 60).padStart(2, "0");

  function acionar() {
    startTransition(async () => {
      const res = aberto
        ? await pararApontamento(apontamentoAbertoId!)
        : await iniciarApontamento(serviceOrderId);
      if (res.ok) {
        toast({
          title: aberto ? "Trabalho pausado" : "Trabalho iniciado",
          variant: "success",
        });
        router.refresh();
      } else {
        toast({
          title: "Não foi possível registrar",
          description: res.error ?? "Tente novamente.",
          variant: "error",
        });
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        <Timer className="h-4 w-4 text-accent" />
        {aberto ? "Em andamento" : "Tempo trabalhado"}
      </div>

      <div
        className="font-mono text-5xl font-bold tabular-nums text-foreground sm:text-6xl"
        aria-live="polite"
      >
        {live ? (
          `${hh}:${mm}:${ss}`
        ) : (
          <span className="text-4xl sm:text-5xl">
            {minutosExecutados > 0 ? formatDuracao(minutosExecutados) : "00:00"}
          </span>
        )}
      </div>

      {aberto && minutosExecutados > 0 && (
        <p className="text-xs text-subtle">
          Total acumulado: {formatDuracao(minutosExecutados)}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        variant={aberto ? "danger" : "primary"}
        disabled={pending || desabilitado}
        onClick={acionar}
        className="min-h-14 w-full max-w-xs text-base"
      >
        {aberto ? (
          <>
            <Square className="h-5 w-5" />
            Parar trabalho
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            Iniciar trabalho
          </>
        )}
      </Button>
    </div>
  );
}
