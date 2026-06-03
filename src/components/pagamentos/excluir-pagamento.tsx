"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deletePagamento } from "@/server/pagamentos";

export function ExcluirPagamento({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await deletePagamento(id);
      setOpen(false);
      if (res.ok) {
        if (redirectTo) router.push(redirectTo);
        router.refresh();
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
        title="Excluir pagamento?"
        description="Esta ação não pode ser desfeita. O registro de pagamento será removido permanentemente."
        confirmLabel="Excluir"
        variant="danger"
        loading={pending}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
