"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "zimmeros-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(stored);
    applyTheme(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme | null) === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function applyTheme(t: Theme) {
    let resolved: "light" | "dark";
    if (t === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = t;
    }
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function choose(t: Theme) {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    setOpen(false);
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
        title="Tema"
        aria-label="Alternar tema"
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            aria-hidden
          />
          <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-border bg-bg-elevated shadow-lg py-1">
            <Option icon={Monitor} label="Sistema" active={theme === "system"} onClick={() => choose("system")} />
            <Option icon={Sun} label="Claro" active={theme === "light"} onClick={() => choose("light")} />
            <Option icon={Moon} label="Escuro" active={theme === "dark"} onClick={() => choose("dark")} />
          </div>
        </>
      )}
    </div>
  );
}

function Option({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-surface transition cursor-pointer"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted" />
        {label}
      </span>
      {active && <Check className="h-4 w-4 text-accent" />}
    </button>
  );
}
