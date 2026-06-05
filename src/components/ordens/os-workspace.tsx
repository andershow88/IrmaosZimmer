"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  ClipboardCheck,
  Timer,
  MessageSquare,
  ShieldCheck,
  Paperclip,
  History,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OSHeader, type OSHeaderData } from "@/components/ordens/os-header";
import { OSActionBar } from "@/components/ordens/os-action-bar";

const ABAS = [
  { value: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { value: "servicos-pecas", label: "Serviços e peças", icon: Wrench },
  { value: "checklist", label: "Checklist", icon: ClipboardCheck },
  { value: "horas", label: "Horas", icon: Timer },
  { value: "comunicacao", label: "Comunicação", icon: MessageSquare },
  { value: "garantias", label: "Garantias", icon: ShieldCheck },
  { value: "anexos", label: "Anexos", icon: Paperclip },
  { value: "historico", label: "Histórico", icon: History },
] as const;

type AbaValue = (typeof ABAS)[number]["value"];

const VALORES = ABAS.map((a) => a.value);
const DEFAULT_ABA: AbaValue = "visao-geral";

export interface OSWorkspaceSlots {
  visaoGeral: ReactNode;
  servicosPecas: ReactNode;
  checklist: ReactNode;
  horas: ReactNode;
  comunicacao: ReactNode;
  garantias: ReactNode;
  anexos: ReactNode;
  historico: ReactNode;
}

export function OSWorkspace({
  header,
  proximaAcaoLabel,
  formId,
  whatsappUrl,
  imprimirHref,
  pagamentoHref,
  podeSalvar,
  slots,
}: {
  header: OSHeaderData;
  /** Rótulo da próxima ação primária (ex.: "Aprovar"). null se finalizada. */
  proximaAcaoLabel: string | null;
  formId: string;
  whatsappUrl: string | null;
  imprimirHref: string;
  pagamentoHref: string;
  podeSalvar: boolean;
  slots: OSWorkspaceSlots;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get("aba");
  const aba: AbaValue = (VALORES as string[]).includes(param ?? "")
    ? (param as AbaValue)
    : DEFAULT_ABA;

  const setAba = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === DEFAULT_ABA) params.delete("aba");
      else params.set("aba", value);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // A "próxima ação" do header leva à aba de visão geral, onde fica o fluxo de status.
  const irParaStatus = useCallback(() => setAba("visao-geral"), [setAba]);

  return (
    <div>
      <OSHeader
        data={header}
        proximaAcaoLabel={proximaAcaoLabel}
        onProximaAcao={irParaStatus}
      />

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList aria-label="Seções da ordem de serviço">
          {ABAS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao-geral">{slots.visaoGeral}</TabsContent>
        <TabsContent value="servicos-pecas">{slots.servicosPecas}</TabsContent>
        <TabsContent value="checklist">{slots.checklist}</TabsContent>
        <TabsContent value="horas">{slots.horas}</TabsContent>
        <TabsContent value="comunicacao">{slots.comunicacao}</TabsContent>
        <TabsContent value="garantias">{slots.garantias}</TabsContent>
        <TabsContent value="anexos">{slots.anexos}</TabsContent>
        <TabsContent value="historico">{slots.historico}</TabsContent>
      </Tabs>

      <OSActionBar
        formId={formId}
        whatsappUrl={whatsappUrl}
        imprimirHref={imprimirHref}
        pagamentoHref={pagamentoHref}
        onMudarStatus={irParaStatus}
        podeSalvar={podeSalvar}
      />
    </div>
  );
}
