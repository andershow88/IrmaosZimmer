"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  CalendarPlus,
  MessageCircle,
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
import { deleteCliente } from "@/server/clientes";

interface ClienteAcoesProps {
  clienteId: string;
  nome: string;
  /** Link wa.me já montado (ou null se sem telefone/whatsapp). */
  whatsappLink: string | null;
  veiculos: KmVeiculoOption[];
  totalVeiculos: number;
  /** Vínculos que impedem a exclusão (Restrict no schema). */
  totalOrdens: number;
  totalOrcamentos: number;
}

/**
 * Barra de ações contextuais do detalhe do cliente.
 * Liga às rotas de criação existentes (sem prefill por query, comportamento
 * idêntico ao acesso direto) e expõe WhatsApp / Registrar quilometragem.
 */
export function ClienteAcoes({
  clienteId,
  nome,
  whatsappLink,
  veiculos,
  totalVeiculos,
  totalOrdens,
  totalOrcamentos,
}: ClienteAcoesProps) {
  const router = useRouter();
  const bloqueado = totalOrdens > 0 || totalOrcamentos > 0;
  const [kmOpen, setKmOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function excluir() {
    setErro(null);
    startTransition(async () => {
      const result = await deleteCliente(clienteId);
      if (result.ok) {
        toast({ title: "Cliente excluído", variant: "success" });
        router.push("/painel/clientes");
        router.refresh();
        return;
      }
      setErro(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/painel/clientes">
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

      {whatsappLink && (
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </Button>
        </a>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setKmOpen(true)}
        disabled={totalVeiculos === 0}
        title={
          totalVeiculos === 0
            ? "Cadastre um veículo para registrar a quilometragem"
            : undefined
        }
      >
        <Gauge className="h-4 w-4" aria-hidden="true" />
        Registrar km
      </Button>

      <Link href={`/painel/clientes/${clienteId}/editar`}>
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
        veiculos={veiculos}
      />

      <ConfirmDialog
        open={delOpen}
        title="Excluir cliente"
        recordName={`Cliente ${nome}`}
        description={
          bloqueado
            ? "Clientes com ordens de serviço ou orçamentos vinculados não podem ser excluídos. Cancele ou transfira esses registros antes de tentar novamente."
            : "Esta ação remove também os veículos e agendamentos vinculados e não pode ser desfeita."
        }
        consequenceItems={
          bloqueado
            ? [
                ...(totalOrdens > 0
                  ? [
                      `${totalOrdens} ordem${totalOrdens > 1 ? "ns" : ""} de serviço (impede a exclusão)`,
                    ]
                  : []),
                ...(totalOrcamentos > 0
                  ? [
                      `${totalOrcamentos} orçamento${totalOrcamentos > 1 ? "s" : ""} (impede a exclusão)`,
                    ]
                  : []),
              ]
            : totalVeiculos > 0
              ? [
                  `${totalVeiculos} veículo${totalVeiculos > 1 ? "s" : ""} vinculado${
                    totalVeiculos > 1 ? "s" : ""
                  }`,
                ]
              : undefined
        }
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={pending}
        onConfirm={excluir}
        onCancel={() => setDelOpen(false)}
      />
      {erro && (
        <p
          role="alert"
          className="basis-full text-sm font-medium text-danger"
        >
          {erro}
        </p>
      )}
    </div>
  );
}
