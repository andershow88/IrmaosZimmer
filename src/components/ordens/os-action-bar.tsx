"use client";

import Link from "next/link";
import {
  Save,
  ArrowRightLeft,
  MessageCircle,
  Printer,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Barra de ações fixa no rodapé do workspace da OS.
 * As ações reaproveitam fluxos existentes:
 * - Salvar: submete o formulário de campos (por id).
 * - Mudar status: navega para a aba de visão geral / status.
 * - WhatsApp: abre o link wa.me já montado.
 * - Documento: abre a versão para impressão.
 * - Pagamento: link para registrar pagamento da OS.
 */
export function OSActionBar({
  formId,
  whatsappUrl,
  imprimirHref,
  pagamentoHref,
  onMudarStatus,
  salvarDisabled = false,
  podeSalvar = true,
}: {
  formId: string;
  whatsappUrl: string | null;
  imprimirHref: string;
  pagamentoHref: string;
  onMudarStatus: () => void;
  salvarDisabled?: boolean;
  podeSalvar?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-bg/80 safe-bottom sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onMudarStatus}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Mudar status</span>
          <span className="sm:hidden">Status</span>
        </Button>

        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary" type="button">
              <MessageCircle className="h-4 w-4 text-success" />
              <span className="hidden sm:inline">Enviar WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>
          </a>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            type="button"
            disabled
            title="Cliente sem telefone"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        )}

        <Link href={imprimirHref} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" type="button">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar documento</span>
            <span className="sm:hidden">Doc</span>
          </Button>
        </Link>

        <Link href={pagamentoHref}>
          <Button size="sm" variant="secondary" type="button">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Registrar pagamento</span>
            <span className="sm:hidden">Pagar</span>
          </Button>
        </Link>

        {podeSalvar && (
          <Button
            size="sm"
            variant="primary"
            type="submit"
            form={formId}
            disabled={salvarDisabled}
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        )}
      </div>
    </div>
  );
}
