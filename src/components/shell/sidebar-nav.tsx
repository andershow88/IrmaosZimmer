"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_GROUPS,
  isGroupActive,
  isItemActive,
  type NavGroup,
} from "@/components/shell/nav-config";

const COLLAPSED_GROUPS_KEY = "zimmeros-nav-collapsed-groups";

/** Hidrata o conjunto de grupos recolhidos a partir do localStorage. */
function readCollapsedGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSED_GROUPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Navegação da sidebar: grupos do contrato (Operação/Relacionamento/Comercial/
 * Estoque/Gestão/Inteligência/Sistema). Cada grupo é colapsável com estado
 * persistido. Quando `iconOnly`, exibe apenas ícones com tooltips e os grupos
 * ficam sempre expandidos (sem cabeçalho de colapso).
 */
export function SidebarNav({
  iconOnly = false,
  onNavigate,
}: {
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedGroups());
    setHydrated(true);
  }, []);

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* ignora indisponibilidade do storage */
      }
      return next;
    });
  }

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin",
        iconOnly ? "px-2" : "px-3"
      )}
    >
      {NAV_GROUPS.map((group) => (
        <Group
          key={group.id}
          group={group}
          pathname={pathname}
          iconOnly={iconOnly}
          // Antes de hidratar, manter expandido para evitar flash de conteúdo.
          collapsed={hydrated ? !!collapsed[group.id] : false}
          onToggle={() => toggleGroup(group.id)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function Group({
  group,
  pathname,
  iconOnly,
  collapsed,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  iconOnly: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const groupActive = isGroupActive(pathname, group);

  // Modo ícones: sem cabeçalho de grupo (sempre "expandido"), separador sutil.
  if (iconOnly) {
    return (
      <div className="flex flex-col gap-0.5 border-b border-border/60 pb-2 last:border-0">
        {group.items.map((item) => (
          <ItemLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item)}
            iconOnly
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  const panelId = `nav-group-${group.id}`;
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        className={cn(
          "flex h-10 items-center justify-between gap-2 rounded-lg px-3 text-[11px] font-semibold uppercase tracking-wide transition cursor-pointer",
          "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          groupActive ? "text-accent" : "text-subtle"
        )}
      >
        <span className="truncate">{group.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={collapsed}
        className="mt-0.5 flex flex-col gap-0.5"
      >
        {group.items.map((item) => (
          <ItemLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function ItemLink({
  item,
  active,
  iconOnly = false,
  onNavigate,
}: {
  item: NavGroup["items"][number];
  active: boolean;
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={iconOnly ? item.label : undefined}
      className={cn(
        "group/navitem relative flex items-center rounded-xl text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        iconOnly ? "h-11 w-11 justify-center" : "min-h-[40px] gap-3 px-3 py-2.5",
        active
          ? "bg-accent-soft text-accent"
          : "text-muted hover:bg-surface hover:text-foreground"
      )}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active && "stroke-[2.5px]")}
      />
      {!iconOnly && <span className="truncate">{item.label}</span>}

      {/* Tooltip em modo ícones (CSS puro, sem dependência externa). */}
      {iconOnly && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity",
            "group-hover/navitem:opacity-100 group-focus-visible/navitem:opacity-100"
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}
