"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface CurrencyFieldProps {
  /** Nome do campo no FormData (submetido como decimal com ponto, ex.: "1234.56"). */
  name: string;
  /** Valor inicial (número ou string decimal com ponto). */
  defaultValue?: number | string | null;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  density?: "sm" | "md";
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function valorParaCentavos(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function formatCentavosBR(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  const inteiro = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  return `${negativo ? "-" : ""}${inteiro.toLocaleString("pt-BR")},${dec}`;
}

/**
 * Campo de moeda (BRL): exibe formatado "1.234,56" com prefixo R$ e submete um
 * decimal com ponto ("1234.56") via input hidden — compatível com os parsers de
 * servidor (`z.coerce.number()` e o `num()` do estoque). Drop-in para inputs de
 * dinheiro `type="number"`. Use apenas em campos monetários (não em inteiros).
 */
export function CurrencyField({
  name,
  defaultValue = null,
  id,
  required,
  disabled,
  placeholder = "0,00",
  className,
  density = "md",
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: CurrencyFieldProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const [centavos, setCentavos] = useState<number | null>(() =>
    valorParaCentavos(defaultValue)
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "");
    if (digitos === "") {
      setCentavos(null);
      return;
    }
    // Limita para evitar overflow numérico (até ~bilhões).
    setCentavos(Number(digitos.slice(0, 13)));
  }

  const display = centavos === null ? "" : formatCentavosBR(centavos);
  const hiddenValue = centavos === null ? "" : (centavos / 100).toFixed(2);

  const sizeClasses =
    density === "sm" ? "h-9 pl-9 pr-3 text-xs" : "h-11 pl-10 pr-3.5 text-sm";

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted",
          density === "sm" ? "text-xs" : "text-sm"
        )}
      >
        R$
      </span>
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(
          "w-full rounded-xl border border-border bg-bg-elevated text-right font-medium tabular-nums text-foreground",
          "placeholder:text-subtle placeholder:font-normal shadow-sm transition",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/50",
          "hover:border-border-strong/70",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/40",
          sizeClasses,
          className
        )}
      />
      {/* Valor canônico submetido (decimal com ponto). */}
      <input type="hidden" name={name} value={hiddenValue} />
    </div>
  );
}
