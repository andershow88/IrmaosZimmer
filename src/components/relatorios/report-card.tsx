import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

/** Wrapper visual padrão para cada relatório. */
export function ReportCard({
  title,
  icon: Icon,
  description,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </CardHeader>
      <CardBody className="pt-0">{children}</CardBody>
    </Card>
  );
}
