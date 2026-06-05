import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent motion-reduce:animate-none",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border-[1.5px]",
        sm: "h-4 w-4 border-2",
        md: "h-5 w-5 border-2",
        lg: "h-8 w-8 border-[3px]",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  /** Rótulo acessível anunciado por leitores de tela. */
  label?: string;
}

/**
 * Indicador de carregamento acessível para uso inline ou em botões.
 * Herda a cor do texto (`currentColor`); em botões `primary` use `text-white`.
 */
export function Spinner({ size, className, label = "Carregando" }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={cn(spinnerVariants({ size }), className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { spinnerVariants };
