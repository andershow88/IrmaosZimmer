"use client";

import { useState, useTransition } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExplicarIA({
  onExplicar,
}: {
  onExplicar: () => Promise<string>;
}) {
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function gerar() {
    startTransition(async () => {
      const out = await onExplicar();
      setTexto(out);
    });
  }

  async function copiar() {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={gerar}
        disabled={pending}
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Gerando..." : "Explicar com IA"}
      </Button>

      {texto && (
        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Explicação para o cliente
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={copiar}>
              {copiado ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{texto}</p>
        </div>
      )}
    </div>
  );
}
