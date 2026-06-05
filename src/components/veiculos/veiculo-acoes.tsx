"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  CalendarPlus,
  Gauge,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  RegistrarKmModal,
  type KmVeiculoOption,
} from "@/components/veiculos/registrar-km-modal";
import { deleteVeiculo } from "@/server/veiculos";

interface VeiculoAcoesProps {
  veiculoId: string;
  descricao: string;
  quilometragem: number | null;
}

/** Barra de ações contextuais do detalhe do veículo. */
export function VeiculoAcoes({
  veiculoId,
  descricao,
  quilometragem,
}: VeiculoAcoesProps) {
  const router = useRouter();
  const [kmOpen, setKmOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const opcaoKm: KmVeiculoOption = {
    id: veiculoId,
    label: descricao,
    quilometragem,
  };

  function excluir() {
    setErro(null);
    startTransition(async () => {
      const result = await deleteVeiculo(veiculoId);
      if (!result.ok) {
        setErro(result.error ?? "Não foi possível excluir o veículo.");
        setDelOpen(false);
        return;
      }
      toast({ title: "Veículo excluído", variant: "success" });
      router.push("/painel/veiculos");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/painel/veiculos">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Button>
      </Link>

      <Link href="/painel/ordens-servico/novo">
        <Button size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova OS
        </Button>
      </Link>

      <Link href="/painel/orcamentos/novo">
        <Button variant="secondary" size="sm">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Novo orçamento
        </Button>
      </Link>

      <Link href="/painel/agenda/novo">
        <Button variant="secondary" size="sm">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Novo agendamento
        </Button>
      </Link>

      <Button variant="outline" size="sm" onClick={() => setKmOpen(true)}>
        <Gauge className="h-4 w-4" aria-hidden="true" />
        Registrar km
      </Button>

      <Link href={`/painel/veiculos/${veiculoId}/editar`}>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
      </Link>

      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setErro(null);
          setDelOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Excluir
      </Button>

      <RegistrarKmModal
        open={kmOpen}
        onClose={() => setKmOpen(false)}
        veiculos={[opcaoKm]}
        veiculoIdInicial={veiculoId}
      />

      <ConfirmDialog
        open={delOpen}
        title="Excluir veículo"
        recordName={descricao}
        description="Esta ação não pode ser desfeita."
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={pending}
        onConfirm={excluir}
        onCancel={() => setDelOpen(false)}
      />
      {erro && (
        <p role="alert" className="basis-full text-sm font-medium text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}
