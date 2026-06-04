import { BellRing, Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GerarAvisosButton } from "@/components/avisos/gerar-avisos-button";
import { AvisosFiltro } from "@/components/avisos/avisos-filtro";
import { AvisoCard } from "@/components/avisos/aviso-card";
import {
  listarAvisosPendentes,
  contarAvisosPendentes,
} from "@/server/avisos";

export const dynamic = "force-dynamic";

type Filtro = "TODOS" | "ANIVERSARIO" | "REVISAO";

function normalizarFiltro(tipo?: string): Filtro {
  if (tipo === "ANIVERSARIO" || tipo === "REVISAO") return tipo;
  return "TODOS";
}

export default async function AvisosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  await requireUser();
  const { tipo } = await searchParams;
  const filtro = normalizarFiltro(tipo);

  const [avisos, contagem] = await Promise.all([
    listarAvisosPendentes(filtro === "TODOS" ? undefined : filtro),
    contarAvisosPendentes(),
  ]);

  return (
    <div>
      <PageHeader
        title="Avisos ao cliente"
        description="Lembretes de aniversário e de revisão preventiva para enviar via WhatsApp."
        icon={BellRing}
        action={<GerarAvisosButton />}
      />

      <div className="mb-4">
        <AvisosFiltro ativo={filtro} contagem={contagem} />
      </div>

      {avisos.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhum aviso pendente"
          message={
            filtro === "TODOS"
              ? 'Use "Gerar avisos agora" para criar lembretes de aniversário e revisão.'
              : "Nenhum aviso pendente para este filtro."
          }
        />
      ) : (
        <div className="space-y-3">
          {avisos.map((aviso) => (
            <AvisoCard key={aviso.id} aviso={aviso} />
          ))}
        </div>
      )}
    </div>
  );
}
