/** Itens padrão de uma inspeção digital. */
export const ITENS_PADRAO: string[] = [
  "Pneus",
  "Freios",
  "Óleo",
  "Fluido de arrefecimento",
  "Bateria",
  "Luzes",
  "Suspensão",
  "Vazamentos",
  "Correias",
  "Filtros",
  "Escapamento",
  "Airbag/sistemas eletrônicos",
];

export type StatusItem = "OK" | "ATENCAO" | "CRITICO" | "NAO_VERIFICADO";

export const STATUS_OPCOES: { value: StatusItem; label: string }[] = [
  { value: "NAO_VERIFICADO", label: "Não verificado" },
  { value: "OK", label: "OK" },
  { value: "ATENCAO", label: "Atenção" },
  { value: "CRITICO", label: "Crítico" },
];
