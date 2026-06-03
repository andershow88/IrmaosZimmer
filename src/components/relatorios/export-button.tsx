"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportTipo = {
  tipo: string;
  label: string;
};

const TIPOS: ExportTipo[] = [
  { tipo: "resumo", label: "Resumo completo" },
  { tipo: "margem", label: "Margem por mês" },
  { tipo: "comissao", label: "Comissão por mecânico" },
  { tipo: "servicos", label: "Serviços mais vendidos" },
  { tipo: "pecas", label: "Peças mais usadas" },
  { tipo: "clientes", label: "Clientes mais frequentes" },
];

/** Botão com menu para exportar relatórios em CSV. */
export function ExportButton({ meses }: { meses: number }) {
  const [open, setOpen] = useState(false);

  function exportar(tipo: string) {
    setOpen(false);
    const url = `/api/relatorios/export?tipo=${encodeURIComponent(tipo)}&meses=${meses}`;
    // Abre a rota num iframe oculto não é necessário: navegar dispara o download.
    window.location.href = url;
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-4 w-4" />
        Exportar CSV
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-bg-elevated py-1 shadow-xl"
          >
            {TIPOS.map((t) => (
              <button
                key={t.tipo}
                type="button"
                role="menuitem"
                onClick={() => exportar(t.tipo)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-muted" />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
