"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteFornecedor } from "@/server/fornecedores";

export function FornecedorDelete({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteFornecedor(id);
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>

      <ConfirmDialog
        open={open}
        title="Excluir fornecedor?"
        description={
          <>
            O fornecedor <strong>{nome}</strong> será removido permanentemente.
            As peças vinculadas continuarão cadastradas, porém sem fornecedor.
            Esta ação não pode ser desfeita.
          </>
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
