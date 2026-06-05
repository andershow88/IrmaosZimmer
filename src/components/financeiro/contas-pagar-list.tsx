"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, Undo2, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { MenuItem } from "@/components/ui/dropdown-menu";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { Modal } from "./modal";
import {
  ContaPagarForm,
  type SupplierOption,
  type ContaPagarInitial,
} from "./conta-pagar-form";
import {
  alternarPagamentoConta,
  excluirContaPagar,
} from "@/server/financeiro";

export type ContaPagarRow = {
  id: string;
  descricao: string;
  supplierId: string | null;
  supplierNome: string | null;
  valor: number;
  vencimento: string; // ISO
  vencimentoInput: string; // yyyy-mm-dd
  pago: boolean;
  dataPagamento: string | null; // ISO
};

function vencida(row: ContaPagarRow): boolean {
  if (row.pago) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(row.vencimento) < hoje;
}

/** Mapeia a situação da conta a pagar para o status de domínio. */
function situacaoPagamento(row: ContaPagarRow): "PAGO" | "VENCIDO" | "EM_ABERTO" {
  if (row.pago) return "PAGO";
  if (vencida(row)) return "VENCIDO";
  return "EM_ABERTO";
}

export function ContasPagarList({
  contas,
  fornecedores,
}: {
  contas: ContaPagarRow[];
  fornecedores: SupplierOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContaPagarInitial | undefined>();
  const [confirmar, setConfirmar] = useState<ContaPagarRow | null>(null);

  function abrirNovo() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function abrirEdicao(row: ContaPagarRow) {
    setEditing({
      id: row.id,
      descricao: row.descricao,
      supplierId: row.supplierId,
      valor: row.valor,
      vencimento: row.vencimentoInput,
    });
    setModalOpen(true);
  }

  function toggle(row: ContaPagarRow) {
    startTransition(async () => {
      const res = await alternarPagamentoConta(row.id);
      if (res.ok) {
        toast({
          title: row.pago ? "Pagamento desfeito" : "Conta marcada como paga",
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
      const res = await excluirContaPagar(id);
      if (res.ok) {
        toast({ title: "Conta a pagar excluída", variant: "success" });
        setConfirmar(null);
        router.refresh();
        return;
      }
      toast({ title: res.error, variant: "error" });
    });
  }

  const columns: Column<ContaPagarRow>[] = [
    {
      key: "descricao",
      header: "Descrição",
      render: (c) => <span className="font-medium text-foreground">{c.descricao}</span>,
    },
    {
      key: "fornecedor",
      header: "Fornecedor",
      render: (c) => <span className="text-sm text-muted">{c.supplierNome ?? "—"}</span>,
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
      render: (c) => <StatusBadge kind="conta_pagar" status={situacaoPagamento(c)} />,
    },
  ];

  function actions(c: ContaPagarRow): MenuItem[] {
    return [
      {
        label: c.pago ? "Desfazer pagamento" : "Marcar como pago",
        icon: c.pago ? Undo2 : Check,
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
          Nova conta a pagar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={contas}
        rowKey={(c) => c.id}
        caption="Lista de contas a pagar"
        showCount={false}
        rowActions={actions}
        emptyIcon={ArrowUpCircle}
        emptyTitle="Nenhuma conta a pagar"
        emptyMessage="Cadastre despesas e compromissos financeiros da oficina."
        emptyAction={
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Nova conta a pagar
          </Button>
        }
        mobileCard={(c) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{c.descricao}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {c.supplierNome ?? "Sem fornecedor"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <StatusBadge kind="conta_pagar" status={situacaoPagamento(c)} />
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
        title={editing ? "Editar conta a pagar" : "Nova conta a pagar"}
        onClose={() => setModalOpen(false)}
      >
        <ContaPagarForm
          fornecedores={fornecedores}
          initial={editing}
          onDone={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmar !== null}
        title="Excluir conta a pagar?"
        recordName={confirmar ? `Conta "${confirmar.descricao}"` : undefined}
        description="Esta ação remove a conta permanentemente e não pode ser desfeita."
        consequenceItems={
          confirmar
            ? [
                `Valor de ${formatBRL(confirmar.valor)}`,
                `Vencimento em ${formatDateBR(confirmar.vencimento)}`,
                ...(confirmar.supplierNome
                  ? [`Fornecedor: ${confirmar.supplierNome}`]
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
