import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  CalendarDays,
  ListChecks,
  Package,
  CreditCard,
  Wallet,
  Truck,
  BarChart3,
  BellRing,
  Sparkles,
  Settings,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Quando true, só fica ativo em correspondência exata da rota. */
  exact?: boolean;
};

export type NavGroup = {
  /** ID estável usado para persistir o estado de colapso. */
  id: string;
  label: string;
  items: NavItem[];
};

/**
 * Grupos de navegação do painel interno (contrato Fase 2).
 *
 * IMPORTANTE: a ordem e os rótulos seguem o contrato. Todas as rotas internas
 * existentes estão presentes — não remover itens sem atualizar o contrato.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "operacao",
    label: "Operação",
    items: [
      { label: "Dashboard", href: "/painel", icon: LayoutDashboard, exact: true },
      { label: "Agenda", href: "/painel/agenda", icon: CalendarDays },
      { label: "Ordens de Serviço", href: "/painel/ordens-servico", icon: ClipboardList },
      { label: "Checklists", href: "/painel/checklists", icon: ListChecks },
    ],
  },
  {
    id: "relacionamento",
    label: "Relacionamento",
    items: [
      { label: "Clientes", href: "/painel/clientes", icon: Users },
      { label: "Veículos", href: "/painel/veiculos", icon: Car },
      { label: "Avisos", href: "/painel/avisos", icon: BellRing },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { label: "Orçamentos", href: "/painel/orcamentos", icon: FileText },
      { label: "Pagamentos", href: "/painel/pagamentos", icon: CreditCard },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    items: [
      { label: "Peças e Estoque", href: "/painel/estoque", icon: Package },
      { label: "Serviços", href: "/painel/servicos", icon: Wrench },
      { label: "Fornecedores", href: "/painel/fornecedores", icon: Truck },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      { label: "Financeiro", href: "/painel/financeiro", icon: Wallet },
      { label: "Relatórios", href: "/painel/relatorios", icon: BarChart3 },
    ],
  },
  {
    id: "inteligencia",
    label: "Inteligência",
    items: [
      { label: "Assistente AI", href: "/painel/assistente", icon: Sparkles },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { label: "Usuários", href: "/painel/configuracoes/usuarios", icon: UserCog },
      { label: "Configurações", href: "/painel/configuracoes", icon: Settings },
    ],
  },
];

/** Lista achatada de todos os itens (usada para desempate de rota ativa). */
const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Verdadeiro se a rota casa com o href do item (exato ou como prefixo). */
function matches(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/**
 * Rota ativa inequívoca: dentre todos os itens que casam com a rota, vence o
 * de href mais específico (mais longo). Assim, em /painel/configuracoes/usuarios
 * destaca-se "Usuários" e não "Configurações"; em /painel/configuracoes/auditoria
 * destaca-se "Configurações".
 */
export function isItemActive(pathname: string, item: NavItem): boolean {
  if (!matches(pathname, item)) return false;
  const melhor = ALL_ITEMS.reduce<NavItem | null>((best, candidate) => {
    if (!matches(pathname, candidate)) return best;
    if (!best || candidate.href.length > best.href.length) return candidate;
    return best;
  }, null);
  return melhor?.href === item.href;
}

/** Verdadeiro se algum item do grupo está ativo (para destacar o grupo-pai). */
export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isItemActive(pathname, item));
}
