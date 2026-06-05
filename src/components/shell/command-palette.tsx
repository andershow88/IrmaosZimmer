"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ItemBusca = {
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

type GrupoBusca = {
  tipo: string;
  label: string;
  itens: ItemBusca[];
};

type Estado = "idle" | "loading" | "ok" | "error";

/**
 * Paleta de comandos / busca global do painel. Auto-contida.
 *
 * Abre com:
 *  - Cmd/Ctrl+K
 *  - window event "open-command-palette"
 *
 * Consome /api/busca?q= com debounce e exibe os resultados agrupados,
 * navegáveis por teclado (↑/↓ e Enter). Enter abre o item selecionado
 * (router.push) e fecha. Esc / clique no fundo fecham.
 *
 * Acessível: role="dialog" + aria-modal, focus trap simples, foco devolvido
 * ao elemento anterior ao fechar, combobox/listbox com aria-activedescendant.
 */
export function CommandPalette() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [grupos, setGrupos] = useState<GrupoBusca[]>([]);
  const [ativo, setAtivo] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reqId = useRef(0);

  // Lista achatada para navegação por teclado (mantém referência ao grupo).
  const itensFlat = useMemo(() => grupos.flatMap((g) => g.itens), [grupos]);

  const fechar = useCallback(() => {
    setOpen(false);
  }, []);

  const abrir = useCallback(() => {
    restoreFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    setOpen(true);
  }, []);

  // Atalhos globais de abertura: Cmd/Ctrl+K e evento custom.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            restoreFocusRef.current =
              (document.activeElement as HTMLElement | null) ?? null;
          }
          return !v;
        });
      }
    }
    function onOpenEvent() {
      abrir();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, [abrir]);

  // Ao abrir: foca o input. Ao fechar: limpa estado e devolve o foco.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    setQuery("");
    setGrupos([]);
    setEstado("idle");
    setAtivo(0);
    restoreFocusRef.current?.focus?.();
  }, [open]);

  // Busca com debounce sempre que a query muda (apenas com a paleta aberta).
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      reqId.current++; // cancela respostas pendentes
      setGrupos([]);
      setEstado("idle");
      setAtivo(0);
      return;
    }

    const id = ++reqId.current;
    setEstado("loading");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (id !== reqId.current) return; // resposta obsoleta
        if (!res.ok) {
          setEstado("error");
          setGrupos([]);
          return;
        }
        const data = (await res.json()) as { grupos?: GrupoBusca[] };
        if (id !== reqId.current) return;
        setGrupos(data.grupos ?? []);
        setAtivo(0);
        setEstado("ok");
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (id !== reqId.current) return;
        setEstado("error");
        setGrupos([]);
      }
    }, 220);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const irPara = useCallback(
    (href: string) => {
      fechar();
      router.push(href);
    },
    [fechar, router]
  );

  // Garante que o item ativo fique visível ao navegar com o teclado.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(
      `[data-index="${ativo}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [ativo, open]);

  // Teclado dentro da paleta: Esc fecha, setas navegam, Enter abre, Tab faz trap.
  function onDialogKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (itensFlat.length) setAtivo((i) => (i + 1) % itensFlat.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (itensFlat.length)
        setAtivo((i) => (i - 1 + itensFlat.length) % itensFlat.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const alvo = itensFlat[ativo];
      if (alvo) irPara(alvo.href);
      return;
    }
    if (e.key === "Tab") {
      // Focus trap: mantém o foco dentro do diálogo.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (!open) return null;

  const q = query.trim();
  const temResultados = itensFlat.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
      onKeyDown={onDialogKeyDown}
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={fechar}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-xl animate-fade-in"
      >
        {/* Campo de busca */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            aria-activedescendant={
              temResultados ? `cmdk-item-${ativo}` : undefined
            }
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, placa, OS, orçamento, peça..."
            className="h-14 w-full border-0 bg-transparent text-sm font-medium text-foreground placeholder:font-normal placeholder:text-subtle focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {estado === "loading" && <Spinner size="sm" className="text-muted" />}
          <button
            type="button"
            onClick={fechar}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
            aria-label="Fechar busca"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resultados */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="Resultados da busca"
          className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin"
        >
          {estado === "error" && (
            <p className="px-3 py-8 text-center text-sm text-danger">
              Não foi possível buscar agora. Tente novamente.
            </p>
          )}

          {estado !== "error" && !q && (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Digite para buscar clientes, veículos, OS, orçamentos, peças e
              fornecedores.
            </p>
          )}

          {estado === "ok" && q && !temResultados && (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Nada encontrado.
            </p>
          )}

          {temResultados &&
            (() => {
              let flatIndex = -1;
              return grupos.map((grupo) => (
                <div key={grupo.tipo} className="mb-1 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                    {grupo.label}
                  </p>
                  {grupo.itens.map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    const selecionado = idx === ativo;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        id={`cmdk-item-${idx}`}
                        data-index={idx}
                        role="option"
                        aria-selected={selecionado}
                        onMouseMove={() => setAtivo(idx)}
                        onClick={() => irPara(item.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer",
                          selecionado
                            ? "bg-accent-soft text-accent"
                            : "text-foreground hover:bg-surface"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.titulo}
                          </p>
                          <p
                            className={cn(
                              "truncate text-xs",
                              selecionado ? "text-accent/80" : "text-muted"
                            )}
                          >
                            {item.subtitulo}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
        </div>

        {/* Rodapé com dicas de teclado */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-[11px] text-subtle">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              ↑
            </kbd>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              ↓
            </kbd>
            navegar
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              Enter
            </kbd>
            abrir
            <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              Esc
            </kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  );
}
