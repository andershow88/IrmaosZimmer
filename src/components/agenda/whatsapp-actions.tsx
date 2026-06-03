"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  waLink,
  msgConfirmacaoAgendamento,
  msgLembreteManutencao,
} from "@/lib/whatsapp";

export interface WhatsappActionsProps {
  telefone: string | null;
  cliente: string;
  veiculo: string;
  dataHora: string;
  servico?: string;
}

export function WhatsappActions({
  telefone,
  cliente,
  veiculo,
  dataHora,
  servico,
}: WhatsappActionsProps) {
  if (!telefone) {
    return (
      <p className="text-sm text-muted">
        Cliente sem WhatsApp/telefone cadastrado para envio de mensagens.
      </p>
    );
  }

  const confirmacao = waLink(
    telefone,
    msgConfirmacaoAgendamento({ cliente, veiculo, dataHora, servico })
  );

  const lembrete = waLink(
    telefone,
    msgLembreteManutencao({
      cliente,
      veiculo,
      servico: servico ?? "uma revisão",
    })
  );

  return (
    <div className="flex flex-wrap gap-2">
      <a href={confirmacao} target="_blank" rel="noopener noreferrer">
        <Button variant="secondary">
          <MessageCircle className="h-4 w-4" />
          Confirmar por WhatsApp
        </Button>
      </a>
      <a href={lembrete} target="_blank" rel="noopener noreferrer">
        <Button variant="outline">
          <MessageCircle className="h-4 w-4" />
          Enviar lembrete
        </Button>
      </a>
    </div>
  );
}
