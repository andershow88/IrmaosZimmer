"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mapa de segmento de rota -> rótulo em pt-BR. */
const LABELS: Record<string, string> = {
  painel: "Painel",
  clientes: "Clientes",
  veiculos: "Veículos",
  "ordens-servico": "Ordens de Serviço",
  orcamentos: "Orçamentos",
  agenda: "Agenda",
  checklists: "Checklists",
  estoque: "Peças e Estoque",
  servicos: "Serviços",
  pagamentos: "Pagamentos",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  avisos: "Avisos",
  fornecedores: "Fornecedores",
  assistente: "Assistente",
  configuracoes: "Configurações",
  usuarios: "Usuários",
  auditoria: "Auditoria",
  movimentacoes: "Movimentações",
  caixa: "Caixa",
  "contas-a-pagar": "Contas a Pagar",
  "contas-a-receber": "Contas a Receber",
  "contas-a-faturar": "Contas a Faturar",
  "fluxo-de-caixa": "Fluxo de Caixa",
  novo: "Novo",
};

/** Detecta IDs (cuid/uuid/numérico) que não devem virar rótulo literal. */
function isId(segment: string): boolean {
  if (/^c[a-z0-9]{20,}$/i.test(segment)) return true; // cuid
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    )
  )
    return true; // uuid
  if (/^\d+$/.test(segment)) return true; // numérico
  return false;
}

function rotulo(segment: string): string {
  if (isId(segment)) return "Detalhe";
  if (LABELS[segment]) return LABELS[segment];
  // Fallback: "kebab-case" -> "Kebab Case".
  return segment
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

type Crumb = { label: string; href: string; isLast: boolean };

/**
 * Trilha de navegação derivada de usePathname(). Cada segmento vira um link
 * (exceto o último, que é o item atual). Auto-contido — não recebe props.
 * Não renderiza nada na raiz do painel (/painel).
 */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);

  // Sem trilha em "/" ou na raiz "/painel".
  if (segments.length <= 1) return null;

  const crumbs: Crumb[] = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return {
      label: rotulo(segment),
      href,
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav aria-label="trilha" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1 text-sm text-muted">
        {crumbs.map((c) => (
          <Fragment key={c.href}>
            <li className="flex min-w-0 items-center">
              {c.isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-semibold text-foreground"
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate rounded transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {c.label}
                </Link>
              )}
            </li>
            {!c.isLast && (
              <li aria-hidden="true" className="flex items-center text-subtle">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
