// Rate-limit simples em memória (janela deslizante por chave).
// Suficiente para um deploy single-instance (IIS/Railway). Para múltiplas
// instâncias, troque por um backend compartilhado (Redis, etc).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  /** true se a requisição está dentro do limite. */
  ok: boolean;
  /** Requisições restantes na janela atual. */
  remaining: number;
  /** Timestamp (ms) em que a janela reinicia. */
  resetAt: number;
};

/**
 * Verifica e consome uma unidade do limite para a chave informada.
 * @param key    Identificador (ex.: userId, IP, "ai:userId").
 * @param limit  Máximo de requisições por janela.
 * @param windowMs Tamanho da janela em milissegundos (padrão 60s).
 */
export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/** Limpa o contador de uma chave (ex.: após login bem-sucedido). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
