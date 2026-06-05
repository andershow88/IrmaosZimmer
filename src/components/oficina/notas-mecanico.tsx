"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { updateCampos } from "@/server/ordens";

/**
 * Edição enxuta de diagnóstico e nota interna pelo mecânico.
 * Reusa a Server Action updateCampos (NÃO altera lógica de negócio).
 * Previne perda de dados: avisa ao sair com alterações não salvas.
 */
export function NotasMecanico({
  serviceOrderId,
  diagnostico,
  obsInternas,
  desabilitado = false,
}: {
  serviceOrderId: string;
  diagnostico: string;
  obsInternas: string;
  desabilitado?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [diag, setDiag] = useState(diagnostico);
  const [nota, setNota] = useState(obsInternas);

  const dirty = diag !== diagnostico || nota !== obsInternas;

  // Prevenção de perda de dados ao fechar/recarregar a aba.
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function salvar() {
    const fd = new FormData();
    fd.set("diagnostico", diag);
    fd.set("obsInternas", nota);
    startTransition(async () => {
      const res = await updateCampos(serviceOrderId, fd);
      if (res.ok) {
        toast({ title: "Notas salvas", variant: "success" });
        router.refresh();
      } else {
        toast({
          title: "Não foi possível salvar",
          description: res.error ?? "Tente novamente.",
          variant: "error",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="diag-mec">Diagnóstico técnico</Label>
        <Textarea
          id="diag-mec"
          value={diag}
          onChange={(e) => setDiag(e.target.value)}
          rows={4}
          disabled={desabilitado || pending}
          placeholder="O que foi encontrado no veículo…"
        />
      </div>

      <div>
        <Label htmlFor="nota-mec">Nota interna</Label>
        <Textarea
          id="nota-mec"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          disabled={desabilitado || pending}
          placeholder="Anotações para a equipe (não visível ao cliente)…"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {dirty && !pending && (
          <span className="text-xs font-medium text-warning">
            Alterações não salvas
          </span>
        )}
        <Button
          type="button"
          size="lg"
          onClick={salvar}
          disabled={pending || desabilitado || !dirty}
          className="min-h-12"
        >
          <Save className="h-5 w-5" />
          {pending ? "Salvando…" : "Salvar notas"}
        </Button>
      </div>
    </div>
  );
}
