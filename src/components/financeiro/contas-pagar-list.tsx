"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { ArrowUpCircle } from "lucide-react";
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

  function toggle(id: string) {
    startTransition(() => void alternarPagamentoConta(id).then(() => router.refresh()));
  }

  function excluir() {
    if (!confirmar) return;
    const id = confirmar.id;
    startTransition(() =>
      excluirContaPagar(id).then(() => {
        setConfirmar(null);
        router.refresh();
      })
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="h-4 w-4" />
          Nova conta a pagar
        </Button>
      </div>

      {contas.length === 0 ? (
        <EmptyState
          icon={ArrowUpCircle}
          title="Nenhuma conta a pagar"
          message="Cadastre despesas e compromissos financeiros da oficina."
          action={
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="h-4 w-4" />
              Nova conta a pagar
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Descrição</TH>
              <TH>Fornecedor</TH>
              <TH className="text-right">Valor</TH>
              <TH>Vencimento</TH>
              <TH>Situação</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {contas.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.descricao}</TD>
                <TD className="text-sm text-muted">{c.supplierNome ?? "—"}</TD>
                <TD className="text-right tabular-nums font-medium">{formatBRL(c.valor)}</TD>
                <TD className="text-sm">{formatDateBR(c.vencimento)}</TD>
                <TD>
                  {c.pago ? (
                    <Badge variant="success">Pago</Badge>
                  ) : vencida(c) ? (
                    <Badge variant="danger">Vencida</Badge>
                  ) : (
                    <Badge variant="warning">Em aberto</Badge>
                  )}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      title={c.pago ? "Desfazer pagamento" : "Marcar como pago"}
                      aria-label={c.pago ? "Desfazer pagamento" : "Marcar como pago"}
                      onClick={() => toggle(c.id)}
                      className={c.pago ? "text-muted" : "text-success"}
                    >
                      {c.pago ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar"
                      aria-label="Editar conta"
                      onClick={() => abrirEdicao(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      aria-label="Excluir conta"
                      onClick={() => setConfirmar(c)}
                      className="text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

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
        description={
          confirmar
            ? `A conta "${confirmar.descricao}" será removida permanentemente.`
            : undefined
        }
        confirmLabel={pending ? "Excluindo…" : "Excluir"}
        loading={pending}
        onConfirm={excluir}
        onCancel={() => setConfirmar(null)}
      />

      {pending && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2 text-xs text-muted shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processando…
        </div>
      )}
    </div>
  );
}
