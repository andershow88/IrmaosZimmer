import { FileText, Paperclip } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateBR } from "@/lib/utils";
import { AnexoDelete } from "@/components/anexos/anexo-delete";

export type AnexoItem = {
  id: string;
  url: string;
  nome: string | null;
  tipo: string | null;
  createdAt: Date;
};

function isImagem(tipo: string | null, url: string): boolean {
  if (tipo) return tipo.startsWith("image/");
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}

/** Galeria de anexos: thumbnails para imagens, cartão para PDFs/outros. */
export function AnexosGaleria({ anexos }: { anexos: AnexoItem[] }) {
  if (anexos.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="Nenhum anexo"
        message="Nenhum arquivo enviado ainda. Use o botão acima para adicionar fotos ou PDFs."
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {anexos.map((a) => {
        const nome = a.nome || "Arquivo";
        const imagem = isImagem(a.tipo, a.url);
        return (
          <li
            key={a.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface/40"
          >
            <div className="absolute right-2 top-2 z-10">
              <AnexoDelete anexoId={a.id} nome={nome} />
            </div>

            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              title={nome}
            >
              {imagem ? (
                <div className="aspect-square w-full bg-surface-2">
                  <img
                    src={a.url}
                    alt={nome}
                    className="h-full w-full object-cover transition group-hover:opacity-90"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted transition group-hover:text-accent">
                  <FileText className="h-10 w-10" />
                  <span className="px-2 text-center text-xs">PDF</span>
                </div>
              )}

              <div className="border-t border-border p-2">
                <p className="truncate text-xs font-medium text-foreground">
                  {nome}
                </p>
                <p className="text-[11px] text-subtle">
                  {formatDateBR(a.createdAt)}
                </p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
