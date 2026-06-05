import { Paperclip } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnexoUpload } from "@/components/anexos/anexo-upload";
import { AnexosGaleria } from "@/components/anexos/anexos-galeria";

/**
 * Seção de anexos da OS carregada de forma assíncrona (lazy via Suspense):
 * a query de anexos sai do caminho crítico de render da OS, então o restante
 * da página é exibido imediatamente enquanto a galeria é transmitida em seguida.
 */
export async function AnexosSecao({
  serviceOrderId,
}: {
  serviceOrderId: string;
}) {
  const anexos = await prisma.attachment.findMany({
    where: { serviceOrderId },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, nome: true, tipo: true, createdAt: true },
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-accent" aria-hidden="true" />
            Anexos
          </span>
        </CardTitle>
        <AnexoUpload serviceOrderId={serviceOrderId} />
      </CardHeader>
      <CardBody>
        <AnexosGaleria anexos={anexos} />
      </CardBody>
    </Card>
  );
}

/** Esqueleto exibido enquanto a seção de anexos carrega. */
export function AnexosSecaoFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-accent" aria-hidden="true" />
            Anexos
          </span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
      </CardBody>
    </Card>
  );
}
