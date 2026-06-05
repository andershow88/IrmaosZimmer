"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { deleteFornecedor } from "@/server/fornecedores";

/** Detecta o erro especial lançado por `redirect()` (sucesso) para re-lançá-lo. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

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
      try {
        await deleteFornecedor(id);
        // Em caso de sucesso a action faz redirect (lança NEXT_REDIRECT abaixo),
        // então este ponto normalmente não é alcançado.
      } catch (error) {
        if (isRedirectError(error)) {
          // Exclusão bem-sucedida: avisa antes de a navegação concluir.
          toast({ title: "Fornecedor excluído", variant: "success" });
          throw error;
        }
        toast({
          title: "Não foi possível excluir o fornecedor",
          description:
            "Verifique se há pedidos de compra vinculados — eles impedem a exclusão.",
          variant: "error",
        });
        setOpen(false);
      }
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
        recordName={`Fornecedor ${nome}`}
        description="Esta ação não pode ser desfeita. Fornecedores com pedidos de compra vinculados não podem ser excluídos."
        consequenceItems={[
          "Pedidos de compra vinculados impedem a exclusão",
          "Peças vinculadas ficarão sem fornecedor (não são removidas)",
          "Contas a pagar vinculadas ficarão sem fornecedor (não são removidas)",
        ]}
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        cancelLabel="Cancelar"
        variant="danger"
        loading={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
