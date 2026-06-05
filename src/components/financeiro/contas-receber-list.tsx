"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, Undo2, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { Modal } from "./modal";
import {
  ContaReceberForm,
  type CustomerOption,
  type OsOption,
  type ContaReceberInitial,
} from "./conta-receber-form";
import {
  alternarRecebimentoConta,
  excluirContaReceber,
} from "@/server/financeiro";

export type ContaReceberRow = {
  id: string;
  descricao: string;
  customerId: string | null;
  customerNome: string | null;
  serviceOrderId: string | null;
  serviceOrderNumero: string | null;
  valor: number;
  vencimento: string; // ISO
  vencimentoInput: string; // yyyy-mm-dd
  recebido: boolean;
  dataRecebimento: string | null; // ISO
};

function vencida(row: ContaReceberRow): boolean {
  if (row.recebido) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(row.vencimento) < hoje;
}

/** Mapeia a situação da conta a receber para o status de domínio. */
function situacaoRecebimento(
  row: ContaReceberRow
): "RECEBIDO" | "VENCIDO" | "EM_ABERTO" {
  if (row.recebido) return "RECEBIDO";
  if (vencida(row)) return "VENCIDO";
  return "EM_ABERTO";
}

export function ContasReceberList({
  contas,
  clientes,
  ordens,
}: {
  contas: ContaReceberRow[];
  clientes: CustomerOption[];
  ordens: OsOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContaReceberInitial | undefined>();
  const [confirmar, setConfirmar] = useState<ContaReceberRow | null>(null);

  function abrirNovo() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function abrirEdicao(row: ContaReceberRow) {
    setEditing({
      id: row.id,
      descricao: row.descricao,
      customerId: row.customerId,
      serviceOrderId: row.serviceOrderId,
      valor: row.valor,
      vencimento: row.vencimentoInput,
    });
    setModalOpen(true);
  }

  function toggle(row: ContaReceberRow) {
    startTransition(async () => {
      const res = await alternarRecebimentoConta(row.id);
      if (res.ok) {
        toast({
          title: row.recebido
            ? "Recebimento desfeito"
            : "Conta marcada como recebida",
          variant: "success",
        });
        router.refresh();
        return;
      }
      toast({ title: res.error, variant: "error" });
    });
  }

  function excluir() {
    if (!confirmar) return;
    const id = confirmar.id;
    startTransition(async () => {
      const res = await excluirContaReceber(id);
      if (res.ok) {
        toast({ title: "Conta a receber excluída", variant: "success" });
        setConfirmar(null);
        router.refresh();
        return;
      }
      toast({ title: res.error, variant: "error" });
    });
  }

  const columns: Column<ContaReceberRow>[] = [
    {
      key: "descricao",
      header: "Descrição",
      render: (c) => <span className="font-medium text-foreground">{c.descricao}</span>,
    },
    {
      key: "cliente",
      header: "Cliente / OS",
      render: (c) => (
        <div className="text-sm text-muted">
          {c.customerNome ?? "—"}
          {c.serviceOrderNumero && (
            <p className="text-xs text-subtle">OS {c.serviceOrderNumero}</p>
          )}
        </div>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      align: "right",
      render: (c) => (
        <span className="tabular-nums font-medium">{formatBRL(c.valor)}</span>
      ),
    },
    {
      key: "vencimento",
      header: "Vencimento",
      render: (c) => <span className="text-sm">{formatDateBR(c.vencimento)}</span>,
    },
    {
      key: "situacao",
      header: "Situação",
      render: (c) => <StatusBadge kind="conta_receber" status={situacaoRecebimento(c)} />,
    },
  ];

  function actions(c: ContaReceberRow): MenuItem[] {
    return [
      {
        label: c.recebido ? "Desfazer recebimento" : "Marcar como recebido",
        icon: c.recebido ? Undo2 : Check,
        disabled: pending,
        onClick: () => toggle(c),
      },
      { label: "Editar", icon: Pencil, onClick: () => abrirEdicao(c) },
      {
        label: "Excluir",
        icon: Trash2,
        variant: "danger",
        onClick: () => setConfirmar(c),
      },
    ];
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="h-4 w-4" />
          Nova conta a receber
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={contas}
        rowKey={(c) => c.id}
        caption="Lista de contas a receber"
        showCount={false}
        rowActions={actions}
        emptyIcon={ArrowDownCircle}
        emptyTitle="Nenhuma conta a receber"
        emptyMessage="Cadastre valores a receber de clientes ou ordens de serviço."
        emptyAction={
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Nova conta a receber
          </Button>
        }
        mobileCard={(c) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{c.descricao}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {c.customerNome ?? "Sem cliente"}
                {c.serviceOrderNumero ? ` · OS ${c.serviceOrderNumero}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <StatusBadge kind="conta_receber" status={situacaoRecebimento(c)} />
                <span>Venc. {formatDateBR(c.vencimento)}</span>
              </div>
            </div>
            <span className="shrink-0 tabular-nums font-medium text-foreground">
              {formatBRL(c.valor)}
            </span>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Editar conta a receber" : "Nova conta a receber"}
        onClose={() => setModalOpen(false)}
      >
        <ContaReceberForm
          clientes={clientes}
          ordens={ordens}
          initial={editing}
          onDone={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmar !== null}
        title="Excluir conta a receber?"
        recordName={confirmar ? `Conta "${confirmar.descricao}"` : undefined}
        description="Esta ação remove a conta permanentemente e não pode ser desfeita."
        consequenceItems={
          confirmar
            ? [
                `Valor de ${formatBRL(confirmar.valor)}`,
                `Vencimento em ${formatDateBR(confirmar.vencimento)}`,
                ...(confirmar.customerNome
                  ? [`Cliente: ${confirmar.customerNome}`]
                  : []),
                ...(confirmar.serviceOrderNumero
                  ? [`OS ${confirmar.serviceOrderNumero}`]
                  : []),
              ]
            : undefined
        }
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        variant="danger"
        loading={pending}
        onConfirm={excluir}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
