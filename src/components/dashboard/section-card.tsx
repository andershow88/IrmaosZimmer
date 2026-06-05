import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "warning" | "danger" | "info";

const ICON_TONE: Record<Tone, string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

const COUNT_VARIANT: Record<Tone, "accent" | "success" | "warning" | "danger" | "info"> = {
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

export interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  tone?: Tone;
  /** Contagem exibida ao lado do título (badge). */
  count?: number;
  /** Link "ver tudo" no cabeçalho. */
  verTudoHref?: string;
  verTudoLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Cartão de seção do dashboard com cabeçalho padronizado (ícone, título,
 * contagem opcional e link "ver tudo"). Reaproveita o `Card` base.
 */
export function SectionCard({
  title,
  icon: Icon,
  tone = "accent",
  count,
  verTudoHref,
  verTudoLabel = "Ver tudo",
  className,
  children,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", ICON_TONE[tone])} />
          <CardTitle className="truncate">{title}</CardTitle>
          {typeof count === "number" && count > 0 && (
            <Badge variant={COUNT_VARIANT[tone]}>{count}</Badge>
          )}
        </div>
        {verTudoHref && (
          <Link
            href={verTudoHref}
            className="shrink-0 rounded-md px-1 text-xs font-semibold text-accent transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {verTudoLabel}
          </Link>
        )}
      </CardHeader>
      <CardBody className="pt-0">{children}</CardBody>
    </Card>
  );
}
