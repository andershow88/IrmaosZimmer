"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Foto = { src: string; caption?: string; alt?: string };

/**
 * Galeria/carrossel simples para o site público.
 * Mostra uma imagem por vez com setas (anterior/próxima) e indicadores.
 * Reutilizável para qualquer conjunto de fotos.
 */
export function FotoCarousel({
  images,
  aspect = "aspect-[3/2]",
}: {
  images: Foto[];
  aspect?: string;
}) {
  const [i, setI] = useState(0);
  const total = images.length;
  if (total === 0) return null;
  const atual = images[i];
  const go = (delta: number) => setI((p) => (p + delta + total) % total);

  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
        <img
          src={atual.src}
          alt={atual.alt ?? atual.caption ?? "Foto da Irmãos Zimmer"}
          className={cn("w-full object-cover", aspect)}
        />
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated/90 text-foreground shadow-md ring-1 ring-border backdrop-blur transition hover:bg-bg-elevated cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-accent text-white shadow-md transition hover:bg-accent-2 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        {atual.caption ? (
          <figcaption className="text-sm font-medium text-muted">
            {atual.caption}
          </figcaption>
        ) : (
          <span />
        )}
        {total > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ir para a imagem ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition",
                  idx === i ? "w-5 bg-accent" : "w-2 bg-border hover:bg-border-strong"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
