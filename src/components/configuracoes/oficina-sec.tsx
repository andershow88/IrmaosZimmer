import Link from "next/link";
import { ScrollText, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { getWorkshopSettings } from "@/server/configuracoes";
import { OficinaForm } from "@/components/configuracoes/oficina-form";

export async function OficinaSecao() {
  const settings = await getWorkshopSettings();

  return (
    <div className="space-y-4">
      <OficinaForm settings={settings} />

      <Card>
        <CardBody className="p-0">
          <Link
            href="/configuracoes/auditoria"
            className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface/50"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Log de auditoria
                </p>
                <p className="text-xs text-muted">
                  Histórico de ações sensíveis realizadas no sistema.
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
