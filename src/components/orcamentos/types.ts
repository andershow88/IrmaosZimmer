import type { StatusOrcamento, TipoItem } from "@prisma/client";

/** Item de orçamento serializado (Decimals -> number) para uso em client components. */
export type OrcamentoItemView = {
  id: string;
  tipo: TipoItem;
  serviceId: string | null;
  partId: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

/** Orçamento serializado para uso em client components. */
export type OrcamentoView = {
  id: string;
  numero: string;
  status: StatusOrcamento;
  serviceOrderId: string | null;
  validade: string | null;
  desconto: number;
  total: number;
  observacoes: string | null;
  createdAt: string;
  cliente: { id: string; nome: string; whatsapp: string | null; telefone: string | null };
  veiculo: { id: string; placa: string; marca: string; modelo: string };
  items: OrcamentoItemView[];
};

/** Opção de serviço disponível para seleção em itens. */
export type ServicoOption = {
  id: string;
  nome: string;
  precoPadrao: number;
};

/** Opção de peça disponível para seleção em itens. */
export type PecaOption = {
  id: string;
  nome: string;
  codigoInterno: string;
  precoVenda: number;
};

/** Opção de cliente para o formulário (com veículos). */
export type ClienteOption = {
  id: string;
  nome: string;
  veiculos: { id: string; placa: string; marca: string; modelo: string }[];
};

/** Opção de OS para o formulário. */
export type OSOption = {
  id: string;
  numero: string;
  clienteNome: string;
  veiculoLabel: string;
};
