"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Lock, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "A Empresa" },
  { href: "/servicos", label: "Serviços" },
  { href: "/acessorios", label: "Acessórios" },
  { href: "/contato", label: "Contato" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg-elevated/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setOpen(false)}
        >
          <img
            src="/logo.png"
            alt="Mecânica Irmãos Zimmer"
            className="logo-plate h-9 w-auto sm:h-10"
          />
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(pathname, link.href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Ações desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/entrar"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle transition hover:text-foreground"
          >
            <Lock className="h-3.5 w-3.5" />
            Área restrita
          </Link>
          <Link
            href="/agendar"
            className={cn(buttonVariants({ variant: "primary", size: "md" }))}
          >
            <CalendarCheck className="h-4 w-4" />
            Agendar
          </Link>
        </div>

        {/* Botão mobile */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition hover:bg-surface lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-border bg-bg-elevated lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive(pathname, link.href)
                    ? "bg-accent-soft text-accent"
                    : "text-foreground hover:bg-surface"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/agendar"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "mt-2 w-full"
              )}
            >
              <CalendarCheck className="h-4 w-4" />
              Agendar horário
            </Link>
            <Link
              href="/entrar"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-subtle transition hover:bg-surface hover:text-foreground"
            >
              <Lock className="h-3.5 w-3.5" />
              Área restrita
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
