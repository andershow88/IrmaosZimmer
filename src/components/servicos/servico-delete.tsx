"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteServico } from "@/server/servicos";

export function ServicoDelete({ id, nome }: { id: string; nome: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteServico(id);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.message ?? "Não foi possível excluir o serviço.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Excluir ${nome}`}
        title="Excluir"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="text-muted hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={open}
        title="Excluir serviço"
        description={
          <>
            Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não
            pode ser desfeita.
            {error && (
              <span className="mt-2 block font-medium text-danger">{error}</span>
            )}
          </>
        }
        confirmLabel="Excluir"
        variant="danger"
        loading={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
