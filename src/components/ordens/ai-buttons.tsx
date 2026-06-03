"use client";

import { useState, useTransition } from "react";
import { Sparkles, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumirOSComIA } from "@/server/ordens";

export function AiButtons({
  serviceOrderId,
  whatsappUrl,
}: {
  serviceOrderId: string;
  /** Link wa.me já montado (veículo pronto). null se não houver telefone. */
  whatsappUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [resumo, setResumo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function gerarResumo() {
    setError(null);
    startTransition(async () => {
      const res = await resumirOSComIA(serviceOrderId);
      if (res.ok && res.texto) {
        setResumo(res.texto);
      } else {
        setError(res.error ?? "Não foi possível gerar o resumo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={gerarResumo}
          disabled={pending}
        >
          <Sparkles className="h-4 w-4 text-accent" />
          {pending ? "Gerando…" : "Resumo interno IA"}
        </Button>

        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" type="button">
              <MessageCircle className="h-4 w-4 text-success" />
              WhatsApp: veículo pronto
            </Button>
          </a>
        ) : (
          <Button variant="secondary" size="sm" disabled title="Cliente sem telefone">
            <MessageCircle className="h-4 w-4" />
            WhatsApp indisponível
          </Button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {resumo && (
        <div className="relative rounded-xl border border-border bg-surface/40 p-4">
          <button
            type="button"
            onClick={() => setResumo(null)}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
            aria-label="Fechar resumo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            Resumo gerado por IA
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{resumo}</p>
        </div>
      )}
    </div>
  );
}
