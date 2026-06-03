"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteGarantia } from "@/server/garantias";

interface GarantiaDeleteProps {
  garantiaId: string;
  descricao: string;
}

/** Botão (ícone) + diálogo de confirmação para excluir uma garantia. */
export function GarantiaDelete({ garantiaId, descricao }: GarantiaDeleteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGarantia(garantiaId);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Não foi possível excluir a garantia.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger cursor-pointer"
        aria-label="Excluir garantia"
        title="Excluir garantia"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={open}
        title="Excluir garantia"
        description={
          <>
            Tem certeza que deseja excluir a garantia{" "}
            <strong>{descricao}</strong>? Esta ação não pode ser desfeita.
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
