import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Bloco de carregamento (placeholder) animado.
 * Respeita `prefers-reduced-motion` (a animação é desligada via `motion-reduce`).
 * Decorativo por padrão (`aria-hidden`); use uma região com `aria-busy`/`role="status"`
 * no contêiner pai para anunciar o estado de carregamento a leitores de tela.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse-soft motion-reduce:animate-none rounded-md bg-surface-2",
        className
      )}
      {...props}
    />
  );
}

/** Linhas de texto simuladas. A última linha sai mais curta (75%). */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Cartão de conteúdo simulado (título + linhas), no mesmo estilo de `Card`. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm",
        className
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText className="mt-4" lines={3} />
    </div>
  );
}
