"use client";

import { useTransition } from "react";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleAtivo } from "@/server/servicos";

export function ServicoToggle({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={ativo ? "Desativar serviço" : "Ativar serviço"}
      title={ativo ? "Desativar" : "Ativar"}
      onClick={() => startTransition(() => void toggleAtivo(id))}
      className={ativo ? "text-success" : "text-muted"}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : ativo ? (
        <Power className="h-4 w-4" />
      ) : (
        <PowerOff className="h-4 w-4" />
      )}
    </Button>
  );
}
