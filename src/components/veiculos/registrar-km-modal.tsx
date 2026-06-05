"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";
import { registrarQuilometragem } from "@/server/veiculos";

export interface KmVeiculoOption {
  id: string;
  /** Texto exibido no seletor (ex.: "Gol — ABC-1234"). */
  label: string;
  quilometragem: number | null;
}

interface RegistrarKmModalProps {
  open: boolean;
  onClose: () => void;
  /** Lista de veículos elegíveis. Se houver só um, o seletor é omitido. */
  veiculos: KmVeiculoOption[];
  /** Veículo pré-selecionado (id). */
  veiculoIdInicial?: string;
}

/**
 * Modal simples para registrar a quilometragem atual de um veículo.
 * Reutilizável nas telas de cliente (vários veículos) e de veículo (um único).
 * Não altera lógica de negócio — apenas chama a action `registrarQuilometragem`.
 */
export function RegistrarKmModal({
  open,
  onClose,
  veiculos,
  veiculoIdInicial,
}: RegistrarKmModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [veiculoId, setVeiculoId] = useState(
    veiculoIdInicial ?? veiculos[0]?.id ?? ""
  );
  const [km, setKm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reinicia o formulário sempre que o modal abre.
  useEffect(() => {
    if (open) {
      setVeiculoId(veiculoIdInicial ?? veiculos[0]?.id ?? "");
      setKm("");
      setError(null);
    }
  }, [open, veiculoIdInicial, veiculos]);

  const selecionado = veiculos.find((v) => v.id === veiculoId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!veiculoId) {
      setError("Selecione um veículo.");
      return;
    }
    startTransition(async () => {
      const result = await registrarQuilometragem(veiculoId, km);
      if (result.ok) {
        toast({
          title: "Quilometragem registrada",
          description: `${formatNumber(result.quilometragem)} km`,
          variant: "success",
        });
        onClose();
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar quilometragem"
      description="Atualize a quilometragem atual do veículo."
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="registrar-km-form"
            size="sm"
            disabled={pending}
          >
            <Gauge className="h-4 w-4" />
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="registrar-km-form" onSubmit={handleSubmit} className="space-y-4">
        {veiculos.length > 1 && (
          <div>
            <Label htmlFor="km-veiculo" required>
              Veículo
            </Label>
            <Select
              id="km-veiculo"
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
            >
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="km-valor" required>
            Quilometragem atual
          </Label>
          <Input
            id="km-valor"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="Ex.: 85000"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "km-erro" : "km-atual"}
          />
          {selecionado?.quilometragem != null ? (
            <p id="km-atual" className="mt-1.5 text-xs text-muted">
              Última registrada: {formatNumber(selecionado.quilometragem)} km
            </p>
          ) : (
            <p id="km-atual" className="mt-1.5 text-xs text-muted">
              Nenhuma quilometragem registrada ainda.
            </p>
          )}
        </div>

        {error && (
          <p id="km-erro" role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
