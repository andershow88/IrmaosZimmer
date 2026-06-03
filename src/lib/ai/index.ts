import "server-only";
import { getOpenAI, getModel, isAIAvailable } from "@/lib/ai/client";
import {
  CUSTOMER_MESSAGE_SYSTEM_PROMPT,
  OS_SUMMARY_SYSTEM_PROMPT,
  MAINTENANCE_SYSTEM_PROMPT,
  INSPECTION_SYSTEM_PROMPT,
  QUOTE_EXPLANATION_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { formatBRL } from "@/lib/utils";
import { prisma } from "@/lib/db";

// Tipos de interação espelham o enum TipoInteracaoIA do schema Prisma.
export type TipoInteracaoIA =
  | "RESUMO_OS"
  | "MENSAGEM_WHATSAPP"
  | "EXPLICACAO_ORCAMENTO"
  | "RECOMENDACAO_MANUTENCAO"
  | "RESUMO_INSPECAO"
  | "BUSCA"
  | "OUTRO";

// ---------------------------------------------------------------------------
// Núcleo: chama a OpenAI ou devolve null (para acionar o mock).
// ---------------------------------------------------------------------------

async function complete(system: string, user: string): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;
  try {
    const res = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("[ai] erro ao chamar OpenAI:", err);
    return null;
  }
}

/** Registra a interação de IA (best-effort — nunca quebra o fluxo principal). */
async function logInteraction(opts: {
  tipo: TipoInteracaoIA;
  input: string;
  output?: string | null;
  userId?: string;
}): Promise<void> {
  try {
    // Acesso defensivo: a tabela pode ainda não existir em estágios iniciais.
    const model = prisma as unknown as {
      aiInteraction?: { create: (args: unknown) => Promise<unknown> };
    };
    if (!model.aiInteraction) return;
    await model.aiInteraction.create({
      data: {
        tipo: opts.tipo,
        input: opts.input,
        output: opts.output ?? null,
        model: isAIAvailable() ? getModel() : "mock",
        userId: opts.userId ?? null,
      },
    });
  } catch {
    // Logging é opcional — ignore falhas silenciosamente.
  }
}

// ---------------------------------------------------------------------------
// 1. Mensagem ao cliente
// ---------------------------------------------------------------------------

export type CustomerMessageContext = {
  cliente: string;
  veiculo?: string;
  assunto: string;
  detalhes?: string;
  userId?: string;
};

export async function generateCustomerMessage(
  ctx: CustomerMessageContext
): Promise<string> {
  const userPrompt = [
    `Cliente: ${ctx.cliente}`,
    ctx.veiculo ? `Veículo: ${ctx.veiculo}` : null,
    `Assunto: ${ctx.assunto}`,
    ctx.detalhes ? `Detalhes: ${ctx.detalhes}` : null,
    "",
    "Escreva uma mensagem curta e cordial para enviar ao cliente.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await complete(CUSTOMER_MESSAGE_SYSTEM_PROMPT, userPrompt);
  const output =
    result ??
    `Olá, ${ctx.cliente}! Aqui é da oficina Irmãos Zimmer. ` +
      `${ctx.assunto}${ctx.veiculo ? ` referente ao seu ${ctx.veiculo}` : ""}. ` +
      `Qualquer dúvida estamos à disposição!`;

  await logInteraction({
    tipo: "MENSAGEM_WHATSAPP",
    input: userPrompt,
    output,
    userId: ctx.userId,
  });
  return output;
}

// ---------------------------------------------------------------------------
// 2. Resumo de Ordem de Serviço
// ---------------------------------------------------------------------------

export type ServiceOrderSummaryInput = {
  numero: string;
  veiculo?: string;
  problemaRelatado?: string;
  diagnostico?: string;
  status?: string;
  itens?: { descricao: string; quantidade?: number }[];
  total?: number | string;
  userId?: string;
};

export async function summarizeServiceOrder(
  os: ServiceOrderSummaryInput
): Promise<string> {
  const userPrompt = [
    `OS: ${os.numero}`,
    os.veiculo ? `Veículo: ${os.veiculo}` : null,
    os.problemaRelatado ? `Problema relatado: ${os.problemaRelatado}` : null,
    os.diagnostico ? `Diagnóstico: ${os.diagnostico}` : null,
    os.status ? `Status: ${os.status}` : null,
    os.itens?.length
      ? `Itens:\n${os.itens
          .map((i) => `- ${i.quantidade ? `${i.quantidade}x ` : ""}${i.descricao}`)
          .join("\n")}`
      : null,
    os.total != null ? `Total: ${formatBRL(os.total)}` : null,
    "",
    "Resuma a OS de forma objetiva para a equipe.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await complete(OS_SUMMARY_SYSTEM_PROMPT, userPrompt);
  const output =
    result ??
    `**OS ${os.numero}** — ${os.veiculo ?? "veículo não informado"}.\n\n` +
      `- Problema: ${os.problemaRelatado ?? "não informado"}\n` +
      `- Diagnóstico: ${os.diagnostico ?? "não informado"}\n` +
      `- Status: ${os.status ?? "não informado"}\n` +
      (os.total != null ? `- Total: ${formatBRL(os.total)}\n` : "") +
      `\n_(Resumo automático — IA indisponível, gerado a partir dos dados da OS.)_`;

  await logInteraction({
    tipo: "RESUMO_OS",
    input: userPrompt,
    output,
    userId: os.userId,
  });
  return output;
}

// ---------------------------------------------------------------------------
// 3. Recomendação de manutenção
// ---------------------------------------------------------------------------

export type MaintenanceInput = {
  km: number;
  veiculo?: string;
  historico?: string[];
  userId?: string;
};

export async function suggestMaintenance(
  input: MaintenanceInput
): Promise<string> {
  const userPrompt = [
    input.veiculo ? `Veículo: ${input.veiculo}` : null,
    `Quilometragem atual: ${input.km} km`,
    input.historico?.length
      ? `Histórico recente:\n${input.historico.map((h) => `- ${h}`).join("\n")}`
      : "Sem histórico informado.",
    "",
    "Quais manutenções preventivas você recomenda agora?",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await complete(MAINTENANCE_SYSTEM_PROMPT, userPrompt);
  const output =
    result ??
    `Com base nos ${input.km.toLocaleString("pt-BR")} km, recomendamos avaliar:\n\n` +
      `- **Troca de óleo e filtro** — item de rotina conforme o manual.\n` +
      `- **Filtros de ar e combustível** — garantem desempenho e economia.\n` +
      `- **Freios (pastilhas/discos)** — segurança em primeiro lugar.\n` +
      `- **Alinhamento e balanceamento** — preservam pneus e direção.\n\n` +
      `_(Sugestão automática — confirme o estado real com uma inspeção presencial.)_`;

  await logInteraction({
    tipo: "RECOMENDACAO_MANUTENCAO",
    input: userPrompt,
    output,
    userId: input.userId,
  });
  return output;
}

// ---------------------------------------------------------------------------
// 4. Resumo de inspeção / checklist
// ---------------------------------------------------------------------------

export type InspectionItemInput = {
  item: string;
  status: "OK" | "ATENCAO" | "CRITICO" | "NAO_VERIFICADO";
  observacao?: string;
};

export async function summarizeInspection(
  items: InspectionItemInput[],
  userId?: string
): Promise<string> {
  const userPrompt = [
    "Itens da inspeção:",
    ...items.map(
      (i) =>
        `- ${i.item}: ${i.status}${i.observacao ? ` (${i.observacao})` : ""}`
    ),
    "",
    "Resuma o resultado da inspeção para o cliente.",
  ].join("\n");

  const result = await complete(INSPECTION_SYSTEM_PROMPT, userPrompt);

  let output = result;
  if (!output) {
    const criticos = items.filter((i) => i.status === "CRITICO");
    const atencao = items.filter((i) => i.status === "ATENCAO");
    const ok = items.filter((i) => i.status === "OK");
    const parts: string[] = [];
    if (criticos.length) {
      parts.push(
        `**Atenção imediata:**\n${criticos
          .map((i) => `- ${i.item}${i.observacao ? ` — ${i.observacao}` : ""}`)
          .join("\n")}`
      );
    }
    if (atencao.length) {
      parts.push(
        `**Pontos a observar:**\n${atencao
          .map((i) => `- ${i.item}${i.observacao ? ` — ${i.observacao}` : ""}`)
          .join("\n")}`
      );
    }
    if (ok.length) {
      parts.push(`**Em boas condições:** ${ok.map((i) => i.item).join(", ")}.`);
    }
    output =
      (parts.join("\n\n") || "Nenhum item verificado.") +
      `\n\n_(Resumo automático — IA indisponível.)_`;
  }

  await logInteraction({
    tipo: "RESUMO_INSPECAO",
    input: userPrompt,
    output,
    userId,
  });
  return output;
}

// ---------------------------------------------------------------------------
// 5. Explicação de orçamento (para o cliente)
// ---------------------------------------------------------------------------

export type QuoteInput = {
  numero: string;
  veiculo?: string;
  itens: { descricao: string; quantidade?: number; precoUnitario?: number | string }[];
  total?: number | string;
  userId?: string;
};

export async function explainQuote(orcamento: QuoteInput): Promise<string> {
  const userPrompt = [
    `Orçamento: ${orcamento.numero}`,
    orcamento.veiculo ? `Veículo: ${orcamento.veiculo}` : null,
    "Itens:",
    ...orcamento.itens.map(
      (i) =>
        `- ${i.quantidade ? `${i.quantidade}x ` : ""}${i.descricao}` +
        (i.precoUnitario != null ? ` — ${formatBRL(i.precoUnitario)}` : "")
    ),
    orcamento.total != null ? `Total: ${formatBRL(orcamento.total)}` : null,
    "",
    "Explique este orçamento para o cliente, item a item.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await complete(QUOTE_EXPLANATION_SYSTEM_PROMPT, userPrompt);
  const output =
    result ??
    `Olá! Segue a explicação do orçamento **${orcamento.numero}**` +
      `${orcamento.veiculo ? ` para o seu ${orcamento.veiculo}` : ""}:\n\n` +
      orcamento.itens
        .map(
          (i) =>
            `- **${i.descricao}**${
              i.precoUnitario != null ? ` (${formatBRL(i.precoUnitario)})` : ""
            } — necessário para manter o veículo seguro e em bom funcionamento.`
        )
        .join("\n") +
      (orcamento.total != null
        ? `\n\n**Total: ${formatBRL(orcamento.total)}**`
        : "") +
      `\n\nQualquer dúvida estamos à disposição. — Irmãos Zimmer`;

  await logInteraction({
    tipo: "EXPLICACAO_ORCAMENTO",
    input: userPrompt,
    output,
    userId: orcamento.userId,
  });
  return output;
}

// ---------------------------------------------------------------------------
// 6. Explicação voltada ao cliente (texto técnico -> linguagem simples)
// ---------------------------------------------------------------------------

export async function customerFacingExplanation(opts: {
  textoTecnico: string;
  contexto?: string;
  userId?: string;
}): Promise<string> {
  const userPrompt = [
    opts.contexto ? `Contexto: ${opts.contexto}` : null,
    `Texto técnico: ${opts.textoTecnico}`,
    "",
    "Reescreva em linguagem simples e cordial para o cliente entender.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await complete(CUSTOMER_MESSAGE_SYSTEM_PROMPT, userPrompt);
  const output =
    result ??
    `${opts.textoTecnico}\n\n_(Explicação automática indisponível no momento — ` +
      `nossa equipe pode detalhar pessoalmente quando preferir.)_`;

  await logInteraction({
    tipo: "OUTRO",
    input: userPrompt,
    output,
    userId: opts.userId,
  });
  return output;
}
