"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Tipos
   ============================================================ */

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  /** `danger` aplica cor destrutiva ao item. */
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** Conteúdo do botão que abre o menu. */
  trigger: ReactNode;
  /** Rótulo acessível do gatilho (obrigatório quando o trigger é só-ícone). */
  triggerLabel: string;
  items: MenuItem[];
  /** Alinhamento horizontal do painel. */
  align?: "start" | "end";
  className?: string;
  /** Classe extra aplicada ao botão de gatilho. */
  triggerClassName?: string;
}

/* ============================================================
   DropdownMenu
   ============================================================ */

/**
 * Menu acessível: `role="menu"`, navegação por setas, Home/End, Esc,
 * click-outside e gestão de foco. O gatilho recebe `aria-haspopup`/`aria-expanded`.
 */
export function DropdownMenu({
  trigger,
  triggerLabel,
  items,
  align = "end",
  className,
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  // Click fora fecha (sem devolver foco ao gatilho).
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, close]);

  // Move o foco para o item ativo.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const enabledIndexes = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i >= 0);

  function openMenu(toIndex: number) {
    setOpen(true);
    setActiveIndex(toIndex);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(enabledIndexes[0] ?? -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const pos = enabledIndexes.indexOf(activeIndex);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = enabledIndexes[(pos + 1) % enabledIndexes.length];
      setActiveIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        enabledIndexes[(pos - 1 + enabledIndexes.length) % enabledIndexes.length];
      setActiveIndex(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  function handleSelect(item: MenuItem) {
    if (item.disabled) return;
    item.onClick?.();
    close();
  }

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        onClick={() => (open ? close(false) : openMenu(-1))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-surface text-foreground",
          triggerClassName
        )}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-bg-elevated p-1 shadow-xl animate-fade-in motion-reduce:animate-none",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <>
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span className="truncate">{item.label}</span>
              </>
            );
            const itemClass = cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition outline-none cursor-pointer",
              item.disabled
                ? "pointer-events-none opacity-50"
                : item.variant === "danger"
                  ? "text-danger hover:bg-danger/10 focus-visible:bg-danger/10"
                  : "text-foreground hover:bg-surface focus-visible:bg-surface"
            );

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={i}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  role="menuitem"
                  tabIndex={-1}
                  href={item.href}
                  onClick={() => close(false)}
                  className={itemClass}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                className={itemClass}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RowActions — menu "⋮" para ações de linha em tabelas/listas
   ============================================================ */

export interface RowActionsProps {
  items: MenuItem[];
  /** Rótulo acessível do gatilho. */
  label?: string;
  align?: "start" | "end";
  className?: string;
}

/**
 * Menu compacto de ações por linha (substitui ícones soltos de editar/excluir).
 * Renderiza nada se `items` estiver vazio.
 */
export function RowActions({
  items,
  label = "Ações",
  align = "end",
  className,
}: RowActionsProps) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu
      trigger={<MoreVertical className="h-4 w-4" />}
      triggerLabel={label}
      items={items}
      align={align}
      className={className}
    />
  );
}
