"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Undo2,
  ArrowDownCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/dialog";
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

  function toggle(id: string) {
    startTransition(() => void alternarRecebimentoConta(id).then(() => router.refresh()));
  }

  function excluir() {
    if (!confirmar) return;
    const id = confirmar.id;
    startTransition(() =>
      excluirContaReceber(id).then(() => {
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
          Nova conta a receber
        </Button>
      </div>

      {contas.length === 0 ? (
        <EmptyState
          icon={ArrowDownCircle}
          title="Nenhuma conta a receber"
          message="Cadastre valores a receber de clientes ou ordens de serviço."
          action={
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="h-4 w-4" />
              Nova conta a receber
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Descrição</TH>
              <TH>Cliente / OS</TH>
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
                <TD className="text-sm text-muted">
                  {c.customerNome ?? "—"}
                  {c.serviceOrderNumero && (
                    <p className="text-xs text-subtle">OS {c.serviceOrderNumero}</p>
                  )}
                </TD>
                <TD className="text-right tabular-nums font-medium">{formatBRL(c.valor)}</TD>
                <TD className="text-sm">{formatDateBR(c.vencimento)}</TD>
                <TD>
                  {c.recebido ? (
                    <Badge variant="success">Recebido</Badge>
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
                      title={c.recebido ? "Desfazer recebimento" : "Marcar como recebido"}
                      aria-label={c.recebido ? "Desfazer recebimento" : "Marcar como recebido"}
                      onClick={() => toggle(c.id)}
                      className={c.recebido ? "text-muted" : "text-success"}
                    >
                      {c.recebido ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
