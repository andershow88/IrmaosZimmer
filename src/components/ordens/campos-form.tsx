"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateCampos, resumirOSComIA } from "@/server/ordens";

export type CamposIniciais = {
  problemaRelatado: string;
  diagnostico: string;
  valorMaoObra: number;
  desconto: number;
  previsaoEntrega: string; // formato yyyy-MM-ddTHH:mm ou ""
  obsInternas: string;
  obsCliente: string;
};

export function CamposForm({
  serviceOrderId,
  iniciais,
}: {
  serviceOrderId: string;
  iniciais: CamposIniciais;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumindo, setResumindo] = useState(false);
  const diagRef = useRef<HTMLTextAreaElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSalvo(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateCampos(serviceOrderId, fd);
      if (res.ok) {
        setSalvo(true);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  }

  function resumirDiagnostico() {
    setError(null);
    setResumindo(true);
    resumirOSComIA(serviceOrderId)
      .then((res) => {
        if (res.ok && res.texto && diagRef.current) {
          const atual = diagRef.current.value.trim();
          diagRef.current.value = atual
            ? `${atual}\n\n--- Resumo IA ---\n${res.texto}`
            : res.texto;
        } else if (!res.ok) {
          setError(res.error ?? "Não foi possível gerar o resumo.");
        }
      })
      .finally(() => setResumindo(false));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="problemaRelatado">Problema relatado</Label>
        <Textarea
          id="problemaRelatado"
          name="problemaRelatado"
          defaultValue={iniciais.problemaRelatado}
          rows={3}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="diagnostico" className="mb-0">
            Diagnóstico
          </Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resumirDiagnostico}
            disabled={resumindo || pending}
          >
            <Sparkles className="h-4 w-4 text-accent" />
            {resumindo ? "Resumindo…" : "Resumir com IA"}
          </Button>
        </div>
        <Textarea
          id="diagnostico"
          name="diagnostico"
          ref={diagRef}
          defaultValue={iniciais.diagnostico}
          rows={4}
          placeholder="Diagnóstico técnico do veículo…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="valorMaoObra">Mão de obra (R$)</Label>
          <Input
            id="valorMaoObra"
            name="valorMaoObra"
            type="number"
            min={0}
            step="0.01"
            defaultValue={iniciais.valorMaoObra}
          />
        </div>
        <div>
          <Label htmlFor="desconto">Desconto (R$)</Label>
          <Input
            id="desconto"
            name="desconto"
            type="number"
            min={0}
            step="0.01"
            defaultValue={iniciais.desconto}
          />
        </div>
        <div>
          <Label htmlFor="previsaoEntrega">Previsão de entrega</Label>
          <Input
            id="previsaoEntrega"
            name="previsaoEntrega"
            type="datetime-local"
            defaultValue={iniciais.previsaoEntrega}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="obsInternas">Observações internas</Label>
          <Textarea
            id="obsInternas"
            name="obsInternas"
            defaultValue={iniciais.obsInternas}
            rows={3}
            placeholder="Visível apenas para a equipe…"
          />
        </div>
        <div>
          <Label htmlFor="obsCliente">Observações ao cliente</Label>
          <Textarea
            id="obsCliente"
            name="obsCliente"
            defaultValue={iniciais.obsCliente}
            rows={3}
            placeholder="Informações que podem ser compartilhadas…"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {salvo && <span className="text-sm font-medium text-success">Salvo!</span>}
        {error && <span className="text-sm font-medium text-danger">{error}</span>}
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
