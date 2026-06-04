"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cake, Wrench, MessageCircle, Check, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateBR } from "@/lib/utils";
import { waLink, msgLembreteManutencao } from "@/lib/whatsapp";
import { marcarEnviado, type AvisoPendente } from "@/server/avisos";

/** Monta a mensagem de WhatsApp adequada ao tipo do aviso. */
function buildMensagem(aviso: AvisoPendente): string {
  if (aviso.tipo === "ANIVERSARIO") {
    return (
      `Olá, ${aviso.clienteNome}! A equipe da Irmãos Zimmer passa para desejar ` +
      `um feliz aniversário! Que seu dia seja ótimo. Conte com a gente sempre que ` +
      `precisar do seu veículo. Um abraço!`
    );
  }
  // REVISAO
  return msgLembreteManutencao({
    cliente: aviso.clienteNome,
    veiculo: aviso.veiculo ?? "seu veículo",
    servico: "uma revisão preventiva",
  });
}

const TIPO_META: Record<
  string,
  { label: string; variant: "accent" | "info" | "warning"; icon: typeof Cake }
> = {
  ANIVERSARIO: { label: "Aniversário", variant: "accent", icon: Cake },
  REVISAO: { label: "Revisão", variant: "warning", icon: Wrench },
};

export function AvisoCard({ aviso }: { aviso: AvisoPendente }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const meta = TIPO_META[aviso.tipo] ?? {
    label: aviso.tipo,
    variant: "info" as const,
    icon: User,
  };
  const Icon = meta.icon;

  const telefone = aviso.whatsapp || aviso.telefone;
  const mensagem = buildMensagem(aviso);
  const link = telefone ? waLink(telefone, mensagem) : null;

  function handleEnviado() {
    setErro(null);
    startTransition(async () => {
      const res = await marcarEnviado(aviso.id);
      if (res.ok) {
        router.refresh();
        return;
      }
      setErro(res.error);
    });
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {aviso.clienteId ? (
                <Link
                  href={`/painel/clientes/${aviso.clienteId}`}
                  className="font-semibold text-foreground hover:text-accent transition"
                >
                  {aviso.clienteNome}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">
                  {aviso.clienteNome}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {aviso.tipo === "ANIVERSARIO"
                ? `Aniversário em ${formatDateBR(aviso.dueDate)}`
                : aviso.veiculo
                  ? `${aviso.veiculo}${aviso.numeroOS ? ` · última OS ${aviso.numeroOS}` : ""}`
                  : "Revisão recomendada"}
            </p>
            {erro && (
              <p className="mt-1 text-xs font-medium text-danger">{erro}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          ) : (
            <span className="text-xs text-muted">Sem WhatsApp</span>
          )}
          <Button size="sm" onClick={handleEnviado} disabled={pending}>
            <Check className="h-4 w-4" />
            {pending ? "Salvando..." : "Marcar enviado"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
