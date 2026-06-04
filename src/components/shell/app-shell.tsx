"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  CalendarDays,
  ListChecks,
  Package,
  CreditCard,
  Wallet,
  Truck,
  BarChart3,
  BellRing,
  Sparkles,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LogoutButton } from "@/components/shell/logout-button";

type NavItem = { label: string; href: string; icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/painel", icon: LayoutDashboard, exact: true },
  { label: "Clientes", href: "/painel/clientes", icon: Users },
  { label: "Veículos", href: "/painel/veiculos", icon: Car },
  { label: "Ordens de Serviço", href: "/painel/ordens-servico", icon: ClipboardList },
  { label: "Orçamentos", href: "/painel/orcamentos", icon: FileText },
  { label: "Agenda", href: "/painel/agenda", icon: CalendarDays },
  { label: "Avisos", href: "/painel/avisos", icon: BellRing },
  { label: "Checklists", href: "/painel/checklists", icon: ListChecks },
  { label: "Peças & Estoque", href: "/painel/estoque", icon: Package },
  { label: "Pagamentos", href: "/painel/pagamentos", icon: CreditCard },
  { label: "Financeiro", href: "/painel/financeiro", icon: Wallet },
  { label: "Fornecedores", href: "/painel/fornecedores", icon: Truck },
  { label: "Relatórios", href: "/painel/relatorios", icon: BarChart3 },
  { label: "Assistente AI", href: "/painel/assistente", icon: Sparkles },
  { label: "Configurações", href: "/painel/configuracoes", icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  ATENDENTE: "Atendente",
  MECANICO: "Mecânico",
  FINANCEIRO: "Financeiro",
  ESTOQUE: "Estoque",
};

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function Logo() {
  return (
    <Link href="/painel" className="flex items-center" aria-label="ZimmerOS AI — Irmãos Zimmer">
      <img src="/logo.png" alt="Mecânica Irmãos Zimmer" className="logo-plate h-9 w-auto" />
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2 scrollbar-thin">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4.5 w-4.5 shrink-0", active && "stroke-[2.5px]")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar({ children }: { children?: ReactNode }) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-bg-elevated">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>
      <NavLinks />
      {children}
    </aside>
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
  const firstName = name?.split(" ")[0] ?? "";
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-bg-elevated shadow-xl animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-bg-elevated/80 px-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
            <span className="text-sm font-semibold text-foreground">{firstName}</span>
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
