import { getAgendaConfigCompleta } from "@/server/agenda-config";
import { AgendaConfigForm } from "@/components/configuracoes/agenda-config-form";
import { AgendaBloqueios } from "@/components/configuracoes/agenda-bloqueios";

/**
 * Seção "Agenda" das configurações (Server Component): carrega config +
 * expediente + bloqueios e renderiza os formulários (Client Components).
 */
export async function AgendaSecao() {
  const { config, expediente, diasBloqueados, resumo } =
    await getAgendaConfigCompleta();

  return (
    <div className="space-y-4">
      <AgendaConfigForm
        config={config}
        expediente={expediente}
        resumo={resumo}
      />
      <AgendaBloqueios diasBloqueados={diasBloqueados} />
    </div>
  );
}
