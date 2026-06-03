import OpenAI from "openai";

let client: OpenAI | null = null;

/** Devolve o cliente OpenAI apenas se a chave estiver configurada, senão null. */
export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** true quando há OPENAI_API_KEY no ambiente. */
export function isAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** Modelo configurado (OPENAI_MODEL) ou fallback. */
export function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
}
