// Máscaras e validadores de campos brasileiros (CPF/CNPJ, telefone, CEP, placa).
// Todas as funções de máscara são tolerantes a entradas parciais — formatam o
// que dá conforme o usuário digita, sem quebrar.

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

/** Máscara progressiva de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function maskCPFCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  // CNPJ: 00.000.000/0000-00
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/** Máscara de telefone/celular: (00) 0000-0000 ou (00) 00000-0000. */
export function maskTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^\((\d{2})\) (\d{4})(\d)/, "($1) $2-$3");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");
}

/** Máscara de CEP: 00000-000. */
export function maskCEP(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

/** Máscara de placa — aceita formato antigo (ABC-1234) e Mercosul (ABC1D23). */
export function maskPlaca(value: string): string {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  // Mercosul: 4ª posição é letra (ABC1D23). Detecta e formata sem hífen.
  const isMercosul = /^[A-Z]{3}\d[A-Z]/.test(raw);
  if (isMercosul) {
    return raw;
  }
  // Antigo: ABC-1234.
  return raw.replace(/^([A-Z]{3})(\d)/, "$1-$2");
}

// ---------------------------------------------------------------------------
// Validadores
// ---------------------------------------------------------------------------

/** Valida CPF (com dígitos verificadores). Aceita string com ou sem máscara. */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const calcDigit = (slice: string, factorStart: number): number => {
    let sum = 0;
    let factor = factorStart;
    for (const ch of slice) {
      sum += Number(ch) * factor;
      factor--;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

/** Valida CNPJ (com dígitos verificadores). Aceita string com ou sem máscara. */
export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // todos iguais

  const calcDigit = (slice: string): number => {
    let sum = 0;
    let factor = slice.length - 7;
    for (const ch of slice) {
      sum += Number(ch) * factor;
      factor = factor === 2 ? 9 : factor - 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(cnpj.slice(0, 12));
  const d2 = calcDigit(cnpj.slice(0, 13));
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

/** Valida CPF ou CNPJ conforme o comprimento. */
export function isValidCPFCNPJ(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCPF(value);
  if (d.length === 14) return isValidCNPJ(value);
  return false;
}
