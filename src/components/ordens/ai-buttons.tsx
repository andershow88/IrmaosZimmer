"use client";

import { useState, useTransition } from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownResult } from "@/components/ui/markdown-result";
import { resumirOSComIA } from "@/server/ordens";

export function AiButtons({
  serviceOrderId,
  whatsappUrl,
  aiModel,
  aiDemo,
}: {
  serviceOrderId: string;
  /** Link wa.me já montado (veículo pronto). null se não houver telefone. */
  whatsappUrl: string | null;
  /** Modelo de IA configurado (para o badge). */
  aiModel?: string;
  /** true quando a IA está em modo demonstração (sem chave). */
  aiDemo?: boolean;
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
        <MarkdownResult
          content={resumo}
          label="Resumo gerado por IA"
          model={aiModel}
          demo={aiDemo}
          pending={pending}
          onRegenerate={gerarResumo}
          onClose={() => setResumo(null)}
        />
      )}
    </div>
  );
}
