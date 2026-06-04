"use client";

import { useState, type ReactNode } from "react";
import { Users, ShieldCheck, Building2, CalendarCog } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "usuarios" | "permissoes" | "oficina" | "agenda";

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "usuarios", label: "Usuários", icon: Users },
  { key: "permissoes", label: "Permissões", icon: ShieldCheck },
  { key: "oficina", label: "Oficina", icon: Building2 },
  { key: "agenda", label: "Agenda", icon: CalendarCog },
];

export function ConfiguracoesTabs({
  usuarios,
  permissoes,
  oficina,
  agenda,
}: {
  usuarios: ReactNode;
  permissoes: ReactNode;
  oficina: ReactNode;
  agenda: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("usuarios");

  const content: Record<TabKey, ReactNode> = {
    usuarios,
    permissoes,
    oficina,
    agenda,
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções das configurações"
        className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-border bg-bg-elevated p-1 shadow-sm"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer",
                selected
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>{content[active]}</div>
    </div>
  );
}
