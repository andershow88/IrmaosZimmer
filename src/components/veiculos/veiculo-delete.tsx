"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { deleteVeiculo } from "@/server/veiculos";

interface VeiculoDeleteProps {
  veiculoId: string;
  /** Texto descritivo do veículo para o diálogo (ex.: "Gol — ABC-1234"). */
  descricao: string;
}

export function VeiculoDelete({ veiculoId, descricao }: VeiculoDeleteProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteVeiculo(veiculoId);
      // Em caso de sucesso a action redireciona; só chegamos aqui em erro.
      if (result && !result.ok) {
        setError(result.error ?? "Não foi possível excluir o veículo.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>

      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={open}
        title="Excluir veículo"
        description={
          <>
            Tem certeza que deseja excluir <strong>{descricao}</strong>? Esta ação
            não pode ser desfeita.
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
