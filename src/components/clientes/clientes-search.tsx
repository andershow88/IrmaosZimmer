"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ClientesSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/painel/clientes?q=${encodeURIComponent(q)}` : "/painel/clientes");
    });
  }

  function clear() {
    setValue("");
    startTransition(() => {
      router.push("/painel/clientes");
    });
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
          className="pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-md text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        Buscar
      </Button>
    </form>
  );
}
