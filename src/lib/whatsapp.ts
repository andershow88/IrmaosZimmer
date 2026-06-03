// Helpers de WhatsApp — gera links wa.me e modelos de mensagem em pt-BR
// para a oficina "Irmãos Zimmer". Os modelos retornam apenas o texto;
// use waLink() para montar o link clicável.

const OFICINA = "Irmãos Zimmer";

/** Normaliza um telefone brasileiro para o formato wa.me: 55 + DDD + número. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Já vem com DDI 55? Mantém. Senão, prefixa 55.
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

/** Monta um link clicável do WhatsApp (abre conversa com a mensagem pronta). */
export function waLink(phone: string, message: string): string {
  const num = normalizePhone(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

// ---------------------------------------------------------------------------
// Modelos de mensagem (pt-BR)
// ---------------------------------------------------------------------------

export function msgOrcamentoEnviado(opts: {
  cliente: string;
  veiculo: string;
  numeroOrcamento: string;
  total: string;
}): string {
  return (
    `Olá, ${opts.cliente}! Aqui é da ${OFICINA}. ` +
    `Preparamos o orçamento ${opts.numeroOrcamento} para o seu ${opts.veiculo}, ` +
    `no valor de ${opts.total}. ` +
    `Qualquer dúvida estamos à disposição. Podemos seguir com o serviço?`
  );
}

export function msgOrcamentoAprovado(opts: {
  cliente: string;
  veiculo: string;
  numeroOrcamento: string;
}): string {
  return (
    `Olá, ${opts.cliente}! Confirmamos a aprovação do orçamento ${opts.numeroOrcamento} ` +
    `para o seu ${opts.veiculo}. Já vamos iniciar o serviço e avisamos quando estiver pronto. ` +
    `Obrigado pela confiança! — ${OFICINA}`
  );
}

export function msgVeiculoPronto(opts: {
  cliente: string;
  veiculo: string;
  numeroOS: string;
}): string {
  return (
    `Boa notícia, ${opts.cliente}! O seu ${opts.veiculo} (OS ${opts.numeroOS}) ` +
    `já está pronto para retirada na ${OFICINA}. ` +
    `Funcionamos de segunda a sexta. Quando puder passar, é só avisar!`
  );
}

export function msgPagamentoPendente(opts: {
  cliente: string;
  numeroOS: string;
  valor: string;
}): string {
  return (
    `Olá, ${opts.cliente}! Passando para lembrar sobre o pagamento pendente ` +
    `da OS ${opts.numeroOS}, no valor de ${opts.valor}. ` +
    `Aceitamos PIX, cartão e dinheiro. Qualquer dúvida, estamos à disposição. — ${OFICINA}`
  );
}

export function msgLembreteManutencao(opts: {
  cliente: string;
  veiculo: string;
  servico: string;
}): string {
  return (
    `Olá, ${opts.cliente}! Aqui é da ${OFICINA}. ` +
    `Notamos que o seu ${opts.veiculo} já está no período recomendado para ${opts.servico}. ` +
    `Que tal agendar uma revisão? Assim você evita problemas maiores e gasta menos. ` +
    `É só responder esta mensagem!`
  );
}

export function msgConfirmacaoAgendamento(opts: {
  cliente: string;
  veiculo: string;
  dataHora: string;
  servico?: string;
}): string {
  const servico = opts.servico ? ` para ${opts.servico}` : "";
  return (
    `Olá, ${opts.cliente}! Confirmamos o seu agendamento na ${OFICINA}${servico} ` +
    `com o veículo ${opts.veiculo} para ${opts.dataHora}. ` +
    `Se precisar remarcar, é só nos avisar. Até lá!`
  );
}
