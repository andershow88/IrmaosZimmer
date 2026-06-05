import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pílula compacta que sinaliza conteúdo gerado por IA e o modo atual:
 * o modelo configurado (ex.: "gpt-4o-mini") ou "modo demonstração" quando não
 * há `OPENAI_API_KEY` (saída simulada). Apenas apresentação — recebe os valores
 * já resolvidos no servidor via props.
 */
export function AiBadge({
  model,
  demo,
  className,
}: {
  model?: string;
  demo?: boolean;
  className?: string;
}) {
  const label = demo ? "modo demonstração" : model || "IA";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        demo
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-accent/30 bg-accent-soft text-accent",
        className
      )}
      title={demo ? "Saída simulada (sem OPENAI_API_KEY)" : `Modelo: ${label}`}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
