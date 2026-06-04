// Dados institucionais e de navegação do SITE PÚBLICO (Irmãos Zimmer).
// Conteúdo em pt-BR. NÃO incluir preços internos nem dados internos do sistema.

/** Endereço real da oficina (fallback quando WorkshopSettings não estiver preenchido). */
export const ENDERECO_FALLBACK = {
  logradouro: "Rua Beno Closs, 2065",
  bairro: "Bairro Amizade",
  cidade: "Santa Maria do Herval",
  estado: "RS",
} as const;

export const EMPRESA = {
  nomeFantasia: "Irmãos Zimmer",
  razaoSocial: "Irmãos Zimmer LTDA",
  fundacao: 1988,
  cidade: "Santa Maria do Herval / RS",
} as const;

/** Itens de navegação do cabeçalho público. */
export const SITE_NAV: { label: string; href: string }[] = [
  { label: "Início", href: "/" },
  { label: "A Empresa", href: "/sobre" },
  { label: "Serviços", href: "/servicos" },
  { label: "Acessórios", href: "/acessorios" },
  { label: "Contato", href: "/contato" },
];

export interface ServiceCategory {
  slug: string;
  titulo: string;
  /** Nome do ícone lucide (resolvido em site-icon.tsx). */
  icone: string;
  descricao: string;
  itens: string[];
}

/**
 * Categorias de serviço com seus subitens (dados reais de irmaoszimmer.com.br).
 * Conteúdo institucional/explicativo — sem valores.
 */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "mecanica-geral",
    titulo: "Mecânica Geral",
    icone: "Wrench",
    descricao:
      "Manutenção e reparo completos do seu veículo, com diagnóstico preciso e peças de qualidade. Cuidamos do coração mecânico do carro para você rodar com segurança.",
    itens: ["Diferencial", "Direção hidráulica", "Freio", "Motor", "Suspensão", "Transmissão"],
  },
  {
    slug: "eletronica-embarcada",
    titulo: "Eletrônica Embarcada",
    icone: "CircuitBoard",
    descricao:
      "Diagnóstico e reparo dos sistemas eletrônicos do veículo com equipamentos especializados. Resolvemos desde sinais no painel até falhas de injeção e partida.",
    itens: [
      "Air Bag",
      "Alternador",
      "Bateria",
      "Freio ABS / ESP",
      "Imobilizador",
      "Injeção / Ignição Eletrônica",
      "Motor de Partida",
      "Regulagem de Motores",
      "Sistemas Elétricos",
      "Travas Elétricas",
      "Vidros Elétricos",
    ],
  },
  {
    slug: "servicos-rapidos",
    titulo: "Serviços Rápidos",
    icone: "Timer",
    descricao:
      "Serviços de manutenção do dia a dia feitos com agilidade e checklist completo, para você manter o carro em dia sem perder tempo.",
    itens: [
      "Arrefecimento",
      "Balanceamento",
      "Catalisador",
      "Escapamento",
      "Iluminação / Sinalização",
      "Pneus",
      "Regulagem de Farol",
      "Troca de Óleo com Checklist",
    ],
  },
  {
    slug: "geometria",
    titulo: "Geometria",
    icone: "Crosshair",
    descricao:
      "Alinhamento e geometria com tecnologia moderna, garantindo direção segura, pneus com vida útil maior e melhor estabilidade na estrada.",
    itens: ["3D", "Computadorizada"],
  },
  {
    slug: "chapeacao",
    titulo: "Chapeação",
    icone: "SprayCan",
    descricao:
      "Recuperação da estrutura e da aparência do veículo, com pintura, polimento e alinhamento de chapas para deixar o carro como novo.",
    itens: ["Pintura", "Polimento / Espelhamento", "Recuperação / Alinhamento"],
  },
  {
    slug: "autopecas",
    titulo: "Autopeças",
    icone: "Cog",
    descricao:
      "Setor de autopeças próprio (desde 1990) para fornecer peças em geral com qualidade e procedência, agilizando o atendimento da sua oficina de confiança.",
    itens: ["Peças em geral"],
  },
  {
    slug: "acessorios",
    titulo: "Acessórios",
    icone: "Car",
    descricao:
      "Instalação de acessórios para mais conforto, segurança e tecnologia no seu veículo. Conheça os detalhes na página de Acessórios.",
    itens: ["Alarme", "Insulfilm", "Sensor de Estacionamento", "Som", "Travas e Vidros Elétricos"],
  },
];

export interface AccessoryItem {
  slug: string;
  titulo: string;
  icone: string;
  descricao: string;
  beneficios: string[];
}

/** Acessórios instalados na oficina, com conteúdo explicativo (sem preços). */
export const ACCESSORIES: AccessoryItem[] = [
  {
    slug: "alarme",
    titulo: "Alarme",
    icone: "BellRing",
    descricao:
      "Instalação de sistemas de alarme para proteger o seu veículo contra furtos e arrombamentos, com sensores e acionamento confiável.",
    beneficios: [
      "Mais segurança no dia a dia",
      "Sensores de presença e impacto",
      "Acionamento prático pelo controle",
    ],
  },
  {
    slug: "insulfilm",
    titulo: "Insulfilm",
    icone: "Sun",
    descricao:
      "Aplicação de películas (insulfilm) que reduzem o calor interno, protegem contra os raios solares e aumentam a privacidade, sempre dentro das normas.",
    beneficios: [
      "Menos calor dentro do carro",
      "Mais privacidade e conforto",
      "Proteção contra raios UV",
    ],
  },
  {
    slug: "sensor-de-estacionamento",
    titulo: "Sensor de Estacionamento",
    icone: "Radar",
    descricao:
      "Instalação de sensores de estacionamento que avisam sobre obstáculos nas manobras, ajudando a evitar batidas e tornando o dia a dia mais tranquilo.",
    beneficios: [
      "Manobras mais seguras",
      "Aviso sonoro de obstáculos",
      "Ideal para garagens apertadas",
    ],
  },
  {
    slug: "som",
    titulo: "Som",
    icone: "Music",
    descricao:
      "Instalação de sistemas de som automotivo com qualidade de áudio, conectividade e acabamento caprichado para você curtir suas músicas na estrada.",
    beneficios: [
      "Áudio com qualidade",
      "Conectividade moderna",
      "Instalação caprichada",
    ],
  },
  {
    slug: "travas-e-vidros-eletricos",
    titulo: "Travas e Vidros Elétricos",
    icone: "Lock",
    descricao:
      "Instalação e manutenção de travas e vidros elétricos, trazendo mais praticidade, conforto e segurança para todos os ocupantes do veículo.",
    beneficios: [
      "Mais praticidade no uso",
      "Conforto para todos os ocupantes",
      "Acionamento rápido e seguro",
    ],
  },
];

export interface Partner {
  nome: string;
  descricao: string;
}

/** Parceiros / selos de qualidade. */
export const PARTNERS: Partner[] = [
  { nome: "Bosch", descricao: "Serviço autorizado em bombas e injeção" },
  { nome: "HDI Seguros", descricao: "Atendimento a veículos segurados" },
];
