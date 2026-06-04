"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarAvisosAction } from "@/server/avisos";

export function GerarAvisosButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [info, setInfo] = useState<string | null>(null);

  function handleGerar() {
    setInfo(null);
    startTransition(async () => {
      const res = await gerarAvisosAction();
      setInfo(
        res.total > 0
          ? `${res.total} aviso(s) gerado(s): ${res.aniversarios} de aniversário, ${res.revisoes} de revisão.`
          : "Nenhum aviso novo a gerar."
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleGerar} disabled={pending}>
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {pending ? "Gerando..." : "Gerar avisos agora"}
      </Button>
      {info && <p className="text-xs text-muted">{info}</p>}
    </div>
  );
}
