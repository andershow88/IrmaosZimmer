"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/assistente/markdown";

/** Caixa de resultado com botão de copiar (para mensagens/sugestões geradas). */
export function ResultBox({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — ignore.
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Resultado
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar
            </>
          )}
        </Button>
      </div>
      <Markdown content={content} />
    </div>
  );
}
