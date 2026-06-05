"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownResult } from "@/components/ui/markdown-result";

export function ExplicarIA({
  onExplicar,
  aiModel,
  aiDemo,
}: {
  onExplicar: () => Promise<string>;
  /** Modelo de IA configurado (para o badge). */
  aiModel?: string;
  /** true quando a IA está em modo demonstração (sem chave). */
  aiDemo?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState<string | null>(null);

  function gerar() {
    startTransition(async () => {
      const out = await onExplicar();
      setTexto(out);
    });
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
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {pending ? "Gerando..." : "Explicar com IA"}
      </Button>

      {texto && (
        <MarkdownResult
          content={texto}
          label="Explicação para o cliente"
          model={aiModel}
          demo={aiDemo}
          pending={pending}
          onRegenerate={gerar}
        />
      )}
    </div>
  );
}
