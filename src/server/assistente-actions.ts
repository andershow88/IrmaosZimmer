"use server";

import { requireUserForAction } from "@/lib/auth";
import { generateCustomerMessage, suggestMaintenance } from "@/lib/ai";
import { searchWorkshopData, type SearchHit } from "@/server/assistente";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Ação rápida: sugerir manutenção preventiva. */
export async function acaoSugerirManutencao(input: {
  veiculo?: string;
  km: number;
  historico?: string;
}): Promise<ActionResult<{ texto: string }>> {
  const user = await requireUserForAction();

  if (!Number.isFinite(input.km) || input.km < 0) {
    return { ok: false, error: "Informe uma quilometragem válida." };
  }

  const historico = (input.historico ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const texto = await suggestMaintenance({
      km: Math.round(input.km),
      veiculo: input.veiculo?.trim() || undefined,
      historico: historico.length ? historico : undefined,
      userId: user.id,
    });
    return { ok: true, data: { texto } };
  } catch {
    return { ok: false, error: "Não foi possível gerar a sugestão agora." };
  }
}

/** Ação rápida: gerar mensagem ao cliente. */
export async function acaoGerarMensagemCliente(input: {
  cliente: string;
  veiculo?: string;
  assunto: string;
  detalhes?: string;
}): Promise<ActionResult<{ texto: string }>> {
  const user = await requireUserForAction();

  if (!input.cliente?.trim()) {
    return { ok: false, error: "Informe o nome do cliente." };
  }
  if (!input.assunto?.trim()) {
    return { ok: false, error: "Informe o assunto da mensagem." };
  }

  try {
    const texto = await generateCustomerMessage({
      cliente: input.cliente.trim(),
      veiculo: input.veiculo?.trim() || undefined,
      assunto: input.assunto.trim(),
      detalhes: input.detalhes?.trim() || undefined,
      userId: user.id,
    });
    return { ok: true, data: { texto } };
  } catch {
    return { ok: false, error: "Não foi possível gerar a mensagem agora." };
  }
}

/** Ação rápida: buscar em dados (clientes, veículos, OS, peças). */
export async function acaoBuscarEmDados(
  termo: string
): Promise<ActionResult<{ hits: SearchHit[] }>> {
  await requireUserForAction();

  if (!termo?.trim()) {
    return { ok: false, error: "Digite um termo para buscar." };
  }

  try {
    const hits = await searchWorkshopData(termo);
    return { ok: true, data: { hits } };
  } catch {
    return { ok: false, error: "Não foi possível realizar a busca agora." };
  }
}
