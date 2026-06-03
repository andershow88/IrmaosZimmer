import "server-only";

// Consultas a APIs públicas brasileiras (sem necessidade de chave):
//  - ViaCEP        -> endereço por CEP
//  - FIPE (BrasilAPI / parallelum) -> marcas, modelos e preço de veículos
//  - CNPJ (BrasilAPI) -> dados cadastrais de empresa
//
// Todas as funções são tolerantes a falha: em qualquer erro (rede, timeout,
// resposta inesperada) retornam `null`/lista vazia em vez de lançar.

const DEFAULT_TIMEOUT = 6000;

/** fetch com timeout via AbortController. Retorna null em qualquer falha. */
async function fetchJson<T>(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      // Dados externos voláteis — não cachear agressivamente.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function onlyDigits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// ViaCEP
// ---------------------------------------------------------------------------

export type EnderecoCEP = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

/** Busca endereço pelo CEP (8 dígitos). Retorna null se inválido/não achado. */
export async function buscarCEP(cep: string): Promise<EnderecoCEP | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;

  const data = await fetchJson<ViaCepResponse>(
    `https://viacep.com.br/ws/${d}/json/`
  );
  if (!data || data.erro) return null;

  return {
    cep: data.cep ?? d,
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf: data.uf ?? "",
  };
}

// ---------------------------------------------------------------------------
// CNPJ (BrasilAPI)
// ---------------------------------------------------------------------------

export type DadosCNPJ = {
  cnpj: string;
  nome: string;
  fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  situacao: string;
};

type BrasilApiCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  descricao_situacao_cadastral?: string;
};

/** Busca dados cadastrais de empresa pelo CNPJ (14 dígitos). null se falhar. */
export async function buscarCNPJ(cnpj: string): Promise<DadosCNPJ | null> {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return null;

  const data = await fetchJson<BrasilApiCnpjResponse>(
    `https://brasilapi.com.br/api/cnpj/v1/${d}`
  );
  if (!data || !data.cnpj) return null;

  const enderecoPartes = [
    data.logradouro,
    data.numero,
    data.complemento,
    data.bairro,
  ].filter((p) => p && p.trim().length > 0);

  return {
    cnpj: data.cnpj,
    nome: data.razao_social ?? "",
    fantasia: data.nome_fantasia ?? "",
    email: data.email ?? "",
    telefone: data.ddd_telefone_1 ?? "",
    endereco: enderecoPartes.join(", "),
    cidade: data.municipio ?? "",
    uf: data.uf ?? "",
    cep: data.cep ?? "",
    situacao: data.descricao_situacao_cadastral ?? "",
  };
}

// ---------------------------------------------------------------------------
// FIPE (BrasilAPI) — marcas, modelos e preço
// ---------------------------------------------------------------------------

/** Tipo de veículo aceito pela FIPE. */
export type TipoVeiculoFipe = "carros" | "motos" | "caminhoes";

export type MarcaFipe = { codigo: string; nome: string };
export type ModeloFipe = { codigo: string; nome: string };
export type PrecoFipe = {
  marca: string;
  modelo: string;
  ano: string;
  combustivel: string;
  valor: string;
  codigoFipe: string;
};

type BrasilApiMarca = { valor?: string; nome?: string };
type BrasilApiPreco = {
  marca?: string;
  modelo?: string;
  anoModelo?: number | string;
  combustivel?: string;
  valor?: string;
  codigoFipe?: string;
};

/**
 * Lista as marcas de um tipo de veículo (padrão: carros).
 * Retorna [] em caso de falha.
 */
export async function buscarMarcasFipe(
  tipo: TipoVeiculoFipe = "carros"
): Promise<MarcaFipe[]> {
  const data = await fetchJson<BrasilApiMarca[]>(
    `https://brasilapi.com.br/api/fipe/marcas/v1/${tipo}`
  );
  if (!Array.isArray(data)) return [];
  return data
    .filter((m) => m.valor && m.nome)
    .map((m) => ({ codigo: String(m.valor), nome: String(m.nome) }));
}

/**
 * Lista os preços/versões FIPE de um veículo pelo código FIPE.
 * (A BrasilAPI expõe a consulta de preço por `codigoFipe`.)
 * Retorna [] em caso de falha.
 */
export async function buscarPrecoFipe(
  codigoFipe: string
): Promise<PrecoFipe[]> {
  const code = (codigoFipe ?? "").trim();
  if (!code) return [];
  const data = await fetchJson<BrasilApiPreco[]>(
    `https://brasilapi.com.br/api/fipe/preco/v1/${encodeURIComponent(code)}`
  );
  if (!Array.isArray(data)) return [];
  return data.map((p) => ({
    marca: p.marca ?? "",
    modelo: p.modelo ?? "",
    ano: String(p.anoModelo ?? ""),
    combustivel: p.combustivel ?? "",
    valor: p.valor ?? "",
    codigoFipe: p.codigoFipe ?? code,
  }));
}

/**
 * Conveniência: tenta resolver o preço FIPE de uma versão específica.
 * Como a BrasilAPI consulta por código FIPE, passamos o código já conhecido
 * (ex.: vindo de outra fonte) e filtramos pelo ano. Retorna null se falhar.
 */
export async function buscarFipe(
  codigoFipe: string,
  ano?: string | number
): Promise<PrecoFipe | null> {
  const precos = await buscarPrecoFipe(codigoFipe);
  if (precos.length === 0) return null;
  if (ano == null) return precos[0];
  const alvo = String(ano);
  return precos.find((p) => p.ano.startsWith(alvo)) ?? precos[0];
}
