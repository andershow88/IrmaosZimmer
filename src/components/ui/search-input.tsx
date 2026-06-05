"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Rótulo acessível (padrão: "Buscar"). */
  "aria-label"?: string;
  /** Atraso de debounce em ms para `onChange`. `0` = imediato (padrão). */
  debounce?: number;
  density?: "sm" | "md";
  autoFocus?: boolean;
  className?: string;
  /** Desativa o botão de limpar. */
  hideClear?: boolean;
}

/**
 * Campo de busca com ícone, botão "limpar" e debounce opcional.
 * Mantém digitação fluida internamente e só propaga `onChange` após o debounce.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  "aria-label": ariaLabel = "Buscar",
  debounce = 0,
  density = "md",
  autoFocus,
  className,
  hideClear = false,
}: SearchInputProps) {
  const [inner, setInner] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Evita sobrescrever a digitação local com props "atrasadas".
  const lastEmitted = useRef(value);

  // Sincroniza com `value` externo apenas quando muda por fora.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setInner(value);
      lastEmitted.current = value;
    }
  }, [value]);

  function emit(next: string) {
    lastEmitted.current = next;
    onChange(next);
  }

  function handleChange(next: string) {
    setInner(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounce > 0) {
      timer.current = setTimeout(() => emit(next), debounce);
    } else {
      emit(next);
    }
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setInner("");
    emit("");
    inputRef.current?.focus();
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const sizeClasses = density === "sm" ? "h-9 text-xs" : "h-11 text-sm";

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle",
          density === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
        )}
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        inputMode="search"
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        value={inner}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-9 font-medium text-foreground",
          "placeholder:text-subtle placeholder:font-normal shadow-sm transition",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/50",
          "hover:border-border-strong/70",
          // Esconde o "x" nativo do type=search (usamos o nosso).
          "[&::-webkit-search-cancel-button]:appearance-none",
          sizeClasses
        )}
      />
      {!hideClear && inner.length > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
