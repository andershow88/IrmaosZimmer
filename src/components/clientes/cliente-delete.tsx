"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteCliente } from "@/server/clientes";

export function ClienteDelete({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCliente(id);
      if (result.ok) {
        setOpen(false);
        router.push("/clientes");
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>

      <ConfirmDialog
        open={open}
        title="Excluir cliente"
        description={
          <span>
            Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação
            também remove os veículos e agendamentos vinculados e não pode ser
            desfeita.
            {error && (
              <span className="mt-2 block font-medium text-danger">{error}</span>
            )}
          </span>
        }
        confirmLabel={isPending ? "Excluindo..." : "Excluir"}
        cancelLabel="Cancelar"
        variant="danger"
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
