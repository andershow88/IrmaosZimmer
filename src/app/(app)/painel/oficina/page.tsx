import { Wrench } from "lucide-react";
import { requirePageRole } from "@/lib/permissions-server";
import { listarMinhasOS } from "@/server/oficina";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { OficinaFiltro } from "@/components/oficina/oficina-filtro";
import { OSCard } from "@/components/oficina/os-card";

export const dynamic = "force-dynamic";

export default async function OficinaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; finalizadas?: string }>;
}) {
  const user = await requirePageRole(["MECANICO", "ADMINISTRADOR"]);
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const incluirFinalizadas = sp.finalizadas === "1";

  const ordens = await listarMinhasOS(user, { q, incluirFinalizadas });

  return (
    <div>
      <PageHeader
        title="Oficina"
        description="Suas ordens de serviço para a bancada."
        icon={Wrench}
      />

      <OficinaFiltro q={q} incluirFinalizadas={incluirFinalizadas} />

      {ordens.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhuma OS atribuída"
          message={
            q || incluirFinalizadas
              ? "Tente ajustar a busca ou exibir as finalizadas."
              : "Quando uma ordem de serviço for atribuída a você, ela aparece aqui."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordens.map((os) => (
            <li key={os.id}>
              <OSCard os={os} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
