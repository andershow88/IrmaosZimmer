"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deletePeca } from "@/server/estoque";

interface DeletePecaButtonProps {
  id: string;
  nome: string;
}

export function DeletePecaButton({ id, nome }: DeletePecaButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deletePeca(id);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
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
        title="Excluir peça"
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
        title="Excluir peça"
        description={
          <span>
            Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não
            pode ser desfeita.
            {error && <span className="mt-2 block text-danger">{error}</span>}
          </span>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
