"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LogoutButton } from "@/components/shell/logout-button";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { CommandPalette } from "@/components/shell/command-palette";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";

const SIDEBAR_COLLAPSED_KEY = "zimmeros-sidebar-collapsed";

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  ATENDENTE: "Atendente",
  MECANICO: "Mecânico",
  FINANCEIRO: "Financeiro",
  ESTOQUE: "Estoque",
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/painel"
      className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label="ZimmerOS AI — Irmãos Zimmer"
    >
      <img
        src="/logo.png"
        alt="Mecânica Irmãos Zimmer"
        className={cn("logo-plate w-auto", compact ? "h-8" : "h-9")}
      />
    </Link>
  );
}

/** Botão de busca do topbar: dispara a paleta de comandos. */
function SearchButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event("open-command-palette"))
      }
      className="group flex h-10 min-w-[40px] items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 text-sm text-muted transition hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
      aria-label="Buscar (atalho Command ou Control + K)"
      title="Buscar (⌘K)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline">Buscar...</span>
      <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-border bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-subtle md:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}

export function AppShell({
  children,
  name,
  role,
}: {
  children: ReactNode;
  name: string;
  role: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  const firstName = name?.split(" ")[0] ?? "";
  const roleLabel = ROLE_LABELS[role] ?? role;

  // Hidrata o estado de colapso da sidebar (persistido).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setCollapsed(stored === "1");
    } catch {
      /* ignora */
    }
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignora */
      }
      return next;
    });
  }

  // Fecha o drawer mobile ao trocar de rota.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Fecha o drawer com Esc.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const iconOnly = hydrated && collapsed;

  return (
    <div className="flex min-h-dvh">
      {/* Skip link acessível */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:border focus:border-border focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        Pular para o conteúdo
      </a>

      {/* Paleta de comandos (montada uma vez) */}
      <CommandPalette />

      {/* Sidebar desktop (>= lg). Colapsável para modo ícones. */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-bg-elevated transition-[width] duration-200 lg:flex",
          iconOnly ? "w-[68px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border",
            iconOnly ? "justify-center px-2" : "px-5"
          )}
        >
          {iconOnly ? <Logo compact /> : <Logo />}
        </div>

        <SidebarNav iconOnly={iconOnly} role={role} />

        {/* Toggle de colapso da sidebar */}
        <div
          className={cn(
            "border-t border-border p-2",
            iconOnly ? "flex justify-center" : ""
          )}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "group/collapse relative flex items-center rounded-xl text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer",
              iconOnly ? "h-11 w-11 justify-center" : "min-h-[40px] w-full gap-3 px-3 py-2.5"
            )}
            aria-label={iconOnly ? "Expandir menu" : "Recolher menu"}
            title={iconOnly ? "Expandir menu" : undefined}
          >
            {iconOnly ? (
              <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
            )}
            {!iconOnly && <span className="truncate">Recolher menu</span>}
            {iconOnly && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity group-hover/collapse:opacity-100 group-focus-visible/collapse:opacity-100"
              >
                Expandir menu
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Drawer mobile/tablet (< lg) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-bg-elevated shadow-xl animate-fade-in"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} role={role} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-bg-elevated/80 px-3 backdrop-blur-xl sm:px-4">
          {/* Abrir drawer (mobile/tablet) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="lg:hidden">
            <Logo />
          </div>

          {/* Busca */}
          <div className="ml-1 hidden flex-1 sm:flex">
            <SearchButton />
          </div>

          {/* Busca compacta no mobile */}
          <div className="flex flex-1 justify-end sm:hidden">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-palette"))
              }
              className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Usuário */}
          <div className="hidden flex-col items-end leading-tight mr-1 sm:flex">
            <span className="text-sm font-semibold text-foreground">
              {firstName}
            </span>
            <span className="text-[11px] text-muted">{roleLabel}</span>
          </div>
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent"
            title={`${name} · ${roleLabel}`}
          >
            {firstName.charAt(0).toUpperCase() || "?"}
          </div>

          <ThemeToggle />
          <LogoutButton />
        </header>

        {/* Trilha de navegação (oculta na raiz do painel pelo próprio componente) */}
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <Breadcrumbs />
        </div>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-4 sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
