"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Wallet,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const ITENS: Item[] = [
  { href: "/painel/financeiro", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/painel/financeiro/contas-a-pagar", label: "Contas a pagar", icon: ArrowUpCircle },
  { href: "/painel/financeiro/contas-a-receber", label: "Contas a receber", icon: ArrowDownCircle },
  { href: "/painel/financeiro/contas-a-faturar", label: "OS a faturar", icon: Receipt },
  { href: "/painel/financeiro/fluxo-de-caixa", label: "Fluxo de caixa", icon: Activity },
  { href: "/painel/financeiro/caixa", label: "Caixa", icon: Wallet },
];

function ativo(pathname: string, item: Item): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/** Navegação por abas das subseções do financeiro. */
export function FinanceiroNav() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Seções do financeiro"
      className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-border bg-bg-elevated p-1 shadow-sm"
    >
      {ITENS.map((item) => {
        const Icon = item.icon;
        const selected = ativo(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={selected}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              selected
                ? "bg-accent text-white shadow-sm shadow-accent/20"
                : "text-muted hover:bg-surface hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
