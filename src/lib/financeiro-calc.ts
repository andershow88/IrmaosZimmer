// Helpers de cálculo financeiro puros (sem dependências de servidor).
// Mantidos fora dos arquivos "use server" para que possam ser importados
// diretamente por Server Components — em arquivos "use server" todo export
// precisa ser uma função async (Server Action).

export type MovimentoLike = { tipo: string; valor: { toString(): string } | number };

/** Saldo = abertura + entradas - saídas. */
export function calcularSaldoSessao(
  valorAbertura: number,
  movimentos: MovimentoLike[]
): number {
  return movimentos.reduce((acc, m) => {
    const v = Number(m.valor);
    return m.tipo === "ENTRADA" ? acc + v : acc - v;
  }, valorAbertura);
}
