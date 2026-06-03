import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Aceita number, string ou Prisma.Decimal (qualquer objeto com toString numérico).
function toNumber(value: number | string | { toString(): string }): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value.toString());
}

/** Formata em Reais brasileiros: "R$ 1.234,56". */
export function formatBRL(value: number | string | { toString(): string }): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Formata um número no padrão pt-BR (separador de milhar "." e decimal ","). */
export function formatNumber(
  value: number | string | { toString(): string },
  decimals = 0
): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(n) ? n : 0);
}

/** "dd/MM/yyyy" — usa date-fns com locale pt-BR. */
export function formatDateBR(d: Date | string): string {
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

/** "dd/MM/yyyy HH:mm" (24h) — usa date-fns com locale pt-BR. */
export function formatDateTimeBR(d: Date | string): string {
  return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/** Saudação conforme a hora de São Paulo (servidor pode estar em UTC). */
export function greeting(): string {
  const hour = Number(
    new Date().toLocaleString("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    })
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
