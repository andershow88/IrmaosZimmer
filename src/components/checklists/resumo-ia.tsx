"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarResumoIA } from "@/server/checklists";

export interface ResumoIAProps {
  inspectionId: string;
  resumo: string | null;
}

export function ResumoIA({ inspectionId, resumo }: ResumoIAProps) {
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
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {resumo}
        </p>
      ) : (
        <p className="text-sm text-muted">
          Nenhum resumo gerado ainda. Use a IA para criar um resumo da inspeção
          voltado ao cliente.
        </p>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <div>
        <Button
          variant={resumo ? "outline" : "primary"}
          size="sm"
          onClick={gerar}
          disabled={isPending}
        >
          {resumo ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isPending
            ? "Gerando..."
            : resumo
              ? "Gerar novamente"
              : "Resumo com IA"}
        </Button>
      </div>
    </div>
  );
}
