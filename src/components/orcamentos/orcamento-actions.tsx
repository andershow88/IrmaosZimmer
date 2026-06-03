"use client";

import { useState, useTransition } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightCircle,
  Trash2,
  MessageCircle,
  Printer,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { StatusOrcamento } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import {
  updateStatus,
  converterEmOS,
  deleteOrcamento,
} from "@/server/orcamentos";
import {
  waLink,
  msgOrcamentoEnviado,
  msgOrcamentoAprovado,
} from "@/lib/whatsapp";
import { formatBRL } from "@/lib/utils";
import type { OrcamentoView } from "./types";

export function OrcamentoActions({ orcamento }: { orcamento: OrcamentoView }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<
    | null
    | { tipo: "status"; status: StatusOrcamento; titulo: string; desc: string }
    | { tipo: "converter" }
    | { tipo: "excluir" }
  >(null);

  const status = orcamento.status;
  const whats = orcamento.cliente.whatsapp || orcamento.cliente.telefone || "";
  const veiculoLabel = `${orcamento.veiculo.marca} ${orcamento.veiculo.modelo}`;

  function mudarStatus(novo: StatusOrcamento) {
    setErro(null);
    startTransition(async () => {
      const res = await updateStatus({ id: orcamento.id, status: novo });
      if (!res.ok) setErro(res.error);
      setConfirmar(null);
    });
  }

  function converter() {
    setErro(null);
    startTransition(async () => {
      const res = await converterEmOS(orcamento.id);
      // converterEmOS redireciona em sucesso; só retorna em erro.
      if (res && !res.ok) setErro(res.error);
      setConfirmar(null);
    });
  }

  function excluir() {
    setErro(null);
    startTransition(async () => {
      const res = await deleteOrcamento(orcamento.id);
      if (res && !res.ok) setErro(res.error);
      setConfirmar(null);
    });
  }

  const linkEnviado = whats
    ? waLink(
        whats,
        msgOrcamentoEnviado({
          cliente: orcamento.cliente.nome,
          veiculo: veiculoLabel,
          numeroOrcamento: orcamento.numero,
          total: formatBRL(orcamento.total),
        })
      )
    : null;

  const linkAprovado = whats
    ? waLink(
        whats,
        msgOrcamentoAprovado({
          cliente: orcamento.cliente.nome,
          veiculo: veiculoLabel,
          numeroOrcamento: orcamento.numero,
        })
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-2">
        {/* Transições de status */}
        {status === "RASCUNHO" && (
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirmar({
                tipo: "status",
                status: "ENVIADO",
                titulo: "Enviar orçamento?",
                desc: "O orçamento passará para o status Enviado.",
              })
            }
          >
            <Send className="h-4 w-4" />
            Marcar como enviado
          </Button>
        )}

        {status === "ENVIADO" && (
          <>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                setConfirmar({
                  tipo: "status",
                  status: "APROVADO",
                  titulo: "Aprovar orçamento?",
                  desc: "O orçamento será marcado como aprovado.",
                })
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprovar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() =>
                setConfirmar({
                  tipo: "status",
                  status: "REJEITADO",
                  titulo: "Rejeitar orçamento?",
                  desc: "O orçamento será marcado como rejeitado.",
                })
              }
            >
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                setConfirmar({
                  tipo: "status",
                  status: "EXPIRADO",
                  titulo: "Marcar como expirado?",
                  desc: "O orçamento será marcado como expirado.",
                })
              }
            >
              <Clock className="h-4 w-4" />
              Marcar como expirado
            </Button>
          </>
        )}

        {status === "EXPIRADO" && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              setConfirmar({
                tipo: "status",
                status: "ENVIADO",
                titulo: "Reenviar orçamento?",
                desc: "O orçamento voltará para o status Enviado.",
              })
            }
          >
            <Send className="h-4 w-4" />
            Reenviar
          </Button>
        )}

        {/* Converter em OS */}
        {status === "APROVADO" && !orcamento.serviceOrderId && (
          <Button
            type="button"
            disabled={pending}
            onClick={() => setConfirmar({ tipo: "converter" })}
          >
            <ArrowRightCircle className="h-4 w-4" />
            Converter em OS
          </Button>
        )}
        {orcamento.serviceOrderId && (
          <Link href={`/ordens-servico/${orcamento.serviceOrderId}`}>
            <Button type="button" variant="secondary" className="w-full">
              <ArrowRightCircle className="h-4 w-4" />
              Ver OS vinculada
            </Button>
          </Link>
        )}

        <div className="my-1 border-t border-border" />

        {/* WhatsApp */}
        {linkEnviado && (status === "RASCUNHO" || status === "ENVIADO") && (
          <a href={linkEnviado} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Enviar por WhatsApp
            </Button>
          </a>
        )}
        {linkAprovado && status === "APROVADO" && (
          <a href={linkAprovado} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secondary" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Confirmar aprovação no WhatsApp
            </Button>
          </a>
        )}
        {!whats && (
          <p className="text-xs text-muted">
            Cliente sem WhatsApp/telefone cadastrado.
          </p>
        )}

        {/* Imprimir */}
        <Link href={`/orcamentos/${orcamento.id}/imprimir`} target="_blank">
          <Button type="button" variant="outline" className="w-full">
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </Link>

        {/* Editar (apenas rascunho) */}
        {status === "RASCUNHO" && (
          <Link href={`/orcamentos/${orcamento.id}/editar`}>
            <Button type="button" variant="outline" className="w-full">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}

        <div className="my-1 border-t border-border" />

        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setConfirmar({ tipo: "excluir" })}
          className="text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Excluir orçamento
        </Button>

        {erro && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {erro}
          </p>
        )}
      </CardBody>

      <ConfirmDialog
        open={confirmar?.tipo === "status"}
        title={confirmar?.tipo === "status" ? confirmar.titulo : ""}
        description={confirmar?.tipo === "status" ? confirmar.desc : ""}
        confirmLabel="Confirmar"
        variant={
          confirmar?.tipo === "status" && confirmar.status === "REJEITADO"
            ? "danger"
            : "primary"
        }
        loading={pending}
        onConfirm={() =>
          confirmar?.tipo === "status" && mudarStatus(confirmar.status)
        }
        onCancel={() => setConfirmar(null)}
      />

      <ConfirmDialog
        open={confirmar?.tipo === "converter"}
        title="Converter em ordem de serviço?"
        description="Será criada uma nova OS com os itens deste orçamento."
        confirmLabel="Converter"
        variant="primary"
        loading={pending}
        onConfirm={converter}
        onCancel={() => setConfirmar(null)}
      />

      <ConfirmDialog
        open={confirmar?.tipo === "excluir"}
        title="Excluir orçamento?"
        description="Esta ação não pode ser desfeita. O orçamento e seus itens serão removidos."
        confirmLabel="Excluir"
        variant="danger"
        loading={pending}
        onConfirm={excluir}
        onCancel={() => setConfirmar(null)}
      />
    </Card>
  );
}
