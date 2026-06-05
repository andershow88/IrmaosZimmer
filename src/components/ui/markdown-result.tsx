"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AiBadge } from "@/components/ui/ai-badge";
import { Markdown } from "@/components/assistente/markdown";

export interface MarkdownResultProps {
  /** Texto em Markdown (renderizado de forma segura, sem HTML bruto). */
  content: string;
  label?: string;
  /** Modelo de IA (exibe AiBadge). */
  model?: string;
  /** true = modo demonstração (sem chave). */
  demo?: boolean;
  /** Em andamento (desabilita "Tentar novamente" e gira o ícone). */
  pending?: boolean;
  /** Regenerar o conteúdo (mostra "Tentar novamente"). */
  onRegenerate?: () => void;
  /** Fechar/descartar o resultado (mostra o X). */
  onClose?: () => void;
  className?: string;
}

/**
 * Caixa de resultado de IA: renderiza Markdown seguro + rótulo + badge de
 * modelo/modo e ações (copiar, tentar novamente, fechar). Unifica a exibição
 * das saídas de IA que antes usavam `whitespace-pre-wrap`.
 */
export function MarkdownResult({
  content,
  label = "Resultado",
  model,
  demo,
  pending,
  onRegenerate,
  onClose,
  className,
}: MarkdownResultProps) {
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
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/40 p-4",
        className
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {label}
          {(model || demo) && <AiBadge model={model} demo={demo} />}
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={copy}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />{" "}
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar
              </>
            )}
          </Button>
          {onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={pending}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  pending && "animate-spin motion-reduce:animate-none"
                )}
                aria-hidden="true"
              />
              {pending ? "Gerando…" : "Tentar novamente"}
            </Button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar resultado"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <Markdown content={content} />
    </div>
  );
}
