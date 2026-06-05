"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownResult } from "@/components/ui/markdown-result";
import { gerarResumoIA } from "@/server/checklists";

export interface ResumoIAProps {
  inspectionId: string;
  resumo: string | null;
  /** Modelo de IA configurado (para o badge). */
  aiModel?: string;
  /** true quando a IA está em modo demonstração (sem chave). */
  aiDemo?: boolean;
}

export function ResumoIA({ inspectionId, resumo, aiModel, aiDemo }: ResumoIAProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function gerar() {
    setErro(null);
    startTransition(async () => {
      const res = await gerarResumoIA(inspectionId);
      if (res.ok) {
        router.refresh();
      } else {
        setErro(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {resumo ? (
        <MarkdownResult
          content={resumo}
          label="Resumo para o cliente"
          model={aiModel}
          demo={aiDemo}
          pending={isPending}
          onRegenerate={gerar}
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            Nenhum resumo gerado ainda. Use a IA para criar um resumo da inspeção
            voltado ao cliente.
          </p>
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={gerar}
              disabled={isPending}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Gerando..." : "Resumo com IA"}
            </Button>
          </div>
        </>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}
    </div>
  );
}
