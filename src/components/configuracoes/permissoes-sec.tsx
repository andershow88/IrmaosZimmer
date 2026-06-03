import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Headset,
  Wrench,
  Wallet,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/roles";
import { ROLE_LABELS } from "@/lib/roles";

type Variant = "accent" | "info" | "warning" | "success" | "default";

const PERMISSOES: {
  role: Role;
  icon: LucideIcon;
  variant: Variant;
  resumo: string;
  acessos: string[];
}[] = [
  {
    role: "ADMINISTRADOR",
    icon: ShieldCheck,
    variant: "accent",
    resumo: "Acesso total ao sistema, incluindo configurações e usuários.",
    acessos: ["Tudo: todos os módulos, relatórios, usuários e permissões"],
  },
  {
    role: "ATENDENTE",
    icon: Headset,
    variant: "info",
    resumo: "Atendimento ao cliente e abertura de serviços.",
    acessos: ["Clientes", "Veículos", "Agenda", "Ordens de serviço", "Orçamentos"],
  },
  {
    role: "MECANICO",
    icon: Wrench,
    variant: "warning",
    resumo: "Execução dos serviços atribuídos a si.",
    acessos: [
      "OS atribuídas",
      "Diagnóstico",
      "Checklists / inspeções",
      "Atualização de status",
    ],
  },
  {
    role: "FINANCEIRO",
    icon: Wallet,
    variant: "success",
    resumo: "Controle financeiro da oficina.",
    acessos: ["Pagamentos", "Relatórios"],
  },
  {
    role: "ESTOQUE",
    icon: Package,
    variant: "default",
    resumo: "Gestão de peças e movimentações de estoque.",
    acessos: ["Peças", "Estoque"],
  },
];

export function PermissoesSecao() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        As permissões são definidas pela função (papel) de cada usuário. Defina a
        função adequada ao cadastrar ou editar um usuário.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PERMISSOES.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.role}>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {ROLE_LABELS[p.role]}
                    </h3>
                    <p className="text-xs text-muted">{p.resumo}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.acessos.map((a) => (
                    <Badge key={a} variant={p.variant}>
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
