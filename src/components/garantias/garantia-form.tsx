"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGarantia } from "@/server/garantias";

interface GarantiaFormProps {
  serviceOrderId: string;
}

/** Formulário inline para cadastrar uma garantia na OS. */
export function GarantiaForm({ serviceOrderId }: GarantiaFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [validadeAte, setValidadeAte] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function handleSubmit() {
    setError(null);
    if (!descricao.trim()) {
      setError("Informe a descrição da garantia.");
      return;
    }
    startTransition(async () => {
      const res = await createGarantia({
        serviceOrderId,
        descricao: descricao.trim(),
        validadeAte: validadeAte || null,
        observacoes: observacoes.trim() || null,
      });
      if (res.ok) {
        setDescricao("");
        setValidadeAte("");
        setObservacoes("");
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao cadastrar a garantia.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldPlus className="h-4 w-4 text-accent" />
        Nova garantia
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="garantia-descricao" required>
            Descrição
          </Label>
          <Input
            id="garantia-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Garantia de 90 dias na troca do alternador"
          />
        </div>

        <div>
          <Label htmlFor="garantia-validade">Válida até</Label>
          <Input
            id="garantia-validade"
            type="date"
            value={validadeAte}
            onChange={(e) => setValidadeAte(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="garantia-obs">Observações</Label>
          <Textarea
            id="garantia-obs"
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Condições, exclusões, etc. (opcional)"
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            <ShieldPlus className="h-4 w-4" />
            {pending ? "Salvando…" : "Adicionar garantia"}
          </Button>
        </div>
      </div>
    </div>
  );
}
