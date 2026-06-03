import { getSession } from "@/lib/auth";
import { getOpenAI, getModel, isAIAvailable } from "@/lib/ai/client";
import { OFICINA_CONTEXT } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getWorkshopContext } from "@/server/assistente";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };

const SYSTEM_PROMPT = `Você é o assistente virtual da oficina mecânica Irmãos Zimmer, integrado ao sistema de gestão ZimmerOS AI.
Ajude a equipe (atendentes, mecânicos, financeiro, estoque e administração) a consultar e entender os dados da oficina e a redigir comunicações com clientes.

# REGRAS
- Responda sempre em Português do Brasil, com tom profissional, cordial e direto.
- Use SOMENTE os dados de contexto fornecidos abaixo. Se a informação não estiver no contexto, diga claramente que não tem esse dado e oriente onde encontrá-lo no sistema.
- Nunca invente clientes, veículos, números de OS, peças, valores ou prazos.
- Você NÃO executa ações no sistema (não cria/edita/exclui registros). Quando pedirem isso, oriente o usuário a usar a tela correspondente.
- Valores em Reais (R$), datas em dd/MM/yyyy.
- Use Markdown comum (listas, negrito) quando ajudar a leitura. Sem LaTeX.

${OFICINA_CONTEXT}`;

/** Monta um bloco de contexto textual com a situação atual da oficina. */
function buildContextBlock(ctx: Awaited<ReturnType<typeof getWorkshopContext>>): string {
  const lines: string[] = [];
  lines.push("# CONTEXTO ATUAL DA OFICINA (dados reais do sistema)");
  lines.push(
    `- Clientes cadastrados: ${ctx.totals.clientes}`,
    `- Veículos cadastrados: ${ctx.totals.veiculos}`,
    `- Ordens de serviço em aberto: ${ctx.totals.osAbertas} (de ${ctx.totals.osTotal} no total)`,
    `- Peças cadastradas: ${ctx.totals.pecas} (${ctx.totals.pecasBaixoEstoque} abaixo do estoque mínimo)`,
    `- Pagamentos pendentes: ${ctx.totals.pagamentosPendentes}`,
    `- Valor total a receber: ${formatBRL(ctx.valorAReceber)}`
  );

  if (ctx.osRecentes.length) {
    lines.push("", "## Ordens de serviço recentes");
    for (const os of ctx.osRecentes) {
      lines.push(
        `- OS ${os.numero} · ${os.cliente} · ${os.veiculo} · ${os.status} · ${formatBRL(
          os.total
        )} · aberta em ${os.data}`
      );
    }
  }

  if (ctx.pecasCriticas.length) {
    lines.push("", "## Peças abaixo do estoque mínimo");
    for (const p of ctx.pecasCriticas) {
      lines.push(
        `- ${p.nome} (${p.codigo}): ${p.quantidade} un em estoque (mínimo ${p.estoqueMinimo})`
      );
    }
  }

  return lines.join("\n");
}

/** Resposta de demonstração (sem OPENAI_API_KEY) usando os dados reais. */
function mockReply(
  pergunta: string,
  ctx: Awaited<ReturnType<typeof getWorkshopContext>>
): string {
  const intro =
    "Estou em **modo demonstração** (sem chave de IA configurada), mas posso responder com os dados reais do sistema:";

  const resumo = [
    `- **Ordens em aberto:** ${ctx.totals.osAbertas}`,
    `- **Valor a receber:** ${formatBRL(ctx.valorAReceber)}`,
    `- **Clientes:** ${ctx.totals.clientes} · **Veículos:** ${ctx.totals.veiculos}`,
    `- **Peças abaixo do mínimo:** ${ctx.totals.pecasBaixoEstoque}`,
  ].join("\n");

  const recentes = ctx.osRecentes.length
    ? "\n\n**Ordens de serviço recentes:**\n" +
      ctx.osRecentes
        .slice(0, 5)
        .map((os) => `- OS ${os.numero} — ${os.cliente} (${os.status})`)
        .join("\n")
    : "";

  const pecas = ctx.pecasCriticas.length
    ? "\n\n**Atenção ao estoque:**\n" +
      ctx.pecasCriticas
        .slice(0, 5)
        .map((p) => `- ${p.nome}: ${p.quantidade} un (mín. ${p.estoqueMinimo})`)
        .join("\n")
    : "";

  const dica = pergunta.trim()
    ? `\n\nVocê perguntou: _"${pergunta.trim()}"_. Configure a variável \`OPENAI_API_KEY\` para respostas completas em linguagem natural.`
    : "";

  return `${intro}\n\n${resumo}${recentes}${pecas}${dica}`;
}

/** Registro best-effort da interação (nunca quebra a resposta). */
async function logBusca(userId: string | null, input: string, output: string) {
  try {
    await prisma.aiInteraction.create({
      data: {
        tipo: "BUSCA",
        input,
        output,
        model: isAIAvailable() ? getModel() : "mock",
        userId,
      },
    });
  } catch {
    // Logging opcional — ignore falhas.
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limited = rateLimit(`assistente:${session.id}`, 20, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas solicitações. Aguarde um instante e tente novamente." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const rawMessages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(rawMessages)) {
    return Response.json(
      { error: "Envie o histórico de mensagens." },
      { status: 400 }
    );
  }

  const messages: ChatMessage[] = rawMessages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        typeof (m as ChatMessage).content === "string" &&
        ["user", "assistant", "system"].includes((m as ChatMessage).role)
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!messages.length) {
    return Response.json(
      { error: "Nenhuma mensagem válida encontrada." },
      { status: 400 }
    );
  }

  const ultimaPergunta =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const ctx = await getWorkshopContext();
  const client = getOpenAI();

  // Modo mock — sem chave de IA.
  if (!client) {
    const reply = mockReply(ultimaPergunta, ctx);
    await logBusca(session.id, ultimaPergunta, reply);
    return Response.json({ reply, mock: true });
  }

  try {
    const res = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: buildContextBlock(ctx) },
        ...messages,
      ],
    });
    const reply =
      res.choices[0]?.message?.content?.trim() ??
      "Não consegui gerar uma resposta agora. Tente reformular a pergunta.";
    await logBusca(session.id, ultimaPergunta, reply);
    return Response.json({ reply, mock: false });
  } catch (err) {
    console.error("[assistente] erro ao chamar OpenAI:", err);
    const reply = mockReply(ultimaPergunta, ctx);
    await logBusca(session.id, ultimaPergunta, reply);
    return Response.json({ reply, mock: true });
  }
}
