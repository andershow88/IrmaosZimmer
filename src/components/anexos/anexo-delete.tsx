"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteAnexo } from "@/server/anexos";

interface AnexoDeleteProps {
  anexoId: string;
  nome: string;
}

/** Botão (ícone) + confirmação para excluir um anexo. */
export function AnexoDelete({ anexoId, nome }: AnexoDeleteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAnexo(anexoId);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Não foi possível excluir o anexo.");
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
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-elevated/80 text-muted shadow-sm backdrop-blur transition hover:bg-danger/10 hover:text-danger cursor-pointer"
        aria-label="Excluir anexo"
        title="Excluir anexo"
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
        title="Excluir anexo"
        description={
          <>
            Tem certeza que deseja excluir <strong>{nome}</strong>? O arquivo
            será removido permanentemente.
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
