import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getRelatoriosData,
  getMargemPorMes,
  getComissaoMecanicos,
} from "@/server/relatorios";

export const dynamic = "force-dynamic";

const MESES_VALIDOS = [3, 6, 12];

// ---------------------------------------------------------------------------
// Helpers CSV (separador ";" — padrão Excel pt-BR; BOM para acentuação)
// ---------------------------------------------------------------------------

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvLinha(cells: (string | number)[]): string {
  return cells.map(csvCell).join(";");
}

/** Número no formato pt-BR para colunas monetárias (vírgula decimal). */
function numBR(n: number): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function montarCsv(linhas: (string | number)[][]): string {
  return linhas.map(csvLinha).join("\r\n");
}

// BOM (U+FEFF) garante que o Excel reconheça UTF-8 (acentos).
const BOM = String.fromCharCode(0xfeff);

function respostaCsv(nome: string, conteudo: string): Response {
  return new Response(BOM + conteudo, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/relatorios/export?tipo=...&meses=...
// tipos: resumo | margem | comissao | servicos | pecas | clientes
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }
  if (!can(user.role, "relatorios")) {
    return new Response("Acesso negado.", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = (searchParams.get("tipo") ?? "resumo").toLowerCase();
  const mesesParam = Number(searchParams.get("meses"));
  const meses = MESES_VALIDOS.includes(mesesParam) ? mesesParam : 6;

  switch (tipo) {
    case "margem": {
      const { series } = await getMargemPorMes(meses);
      const linhas: (string | number)[][] = [
        ["Período", "Receita (R$)", "Custo peças (R$)", "Margem (R$)"],
        ...series.map((s) => [s.periodo, numBR(s.receita), numBR(s.custo), numBR(s.margem)]),
      ];
      return respostaCsv(`margem-${meses}m.csv`, montarCsv(linhas));
    }

    case "comissao": {
      const dados = await getComissaoMecanicos();
      const linhas: (string | number)[][] = [
        ["Mecânico", "Ordens", "Faturamento (R$)", "Comissão (%)", "Comissão (R$)"],
        ...dados.map((d) => [
          d.nome,
          d.ordens,
          numBR(d.faturamento),
          numBR(d.comissaoPercent),
          numBR(d.comissao),
        ]),
      ];
      return respostaCsv("comissao-mecanicos.csv", montarCsv(linhas));
    }

    case "servicos": {
      const { servicosMaisVendidos } = await getRelatoriosData(meses);
      const linhas: (string | number)[][] = [
        ["Serviço", "Quantidade", "Valor (R$)"],
        ...servicosMaisVendidos.map((s) => [s.nome, s.quantidade, numBR(s.valor)]),
      ];
      return respostaCsv("servicos-mais-vendidos.csv", montarCsv(linhas));
    }

    case "pecas": {
      const { pecasMaisUsadas } = await getRelatoriosData(meses);
      const linhas: (string | number)[][] = [
        ["Peça", "Quantidade", "Valor (R$)"],
        ...pecasMaisUsadas.map((p) => [p.nome, p.quantidade, numBR(p.valor)]),
      ];
      return respostaCsv("pecas-mais-usadas.csv", montarCsv(linhas));
    }

    case "clientes": {
      const { clientesMaisFrequentes } = await getRelatoriosData(meses);
      const linhas: (string | number)[][] = [
        ["Cliente", "Ordens de serviço"],
        ...clientesMaisFrequentes.map((c) => [c.nome, c.ordens]),
      ];
      return respostaCsv("clientes-mais-frequentes.csv", montarCsv(linhas));
    }

    case "resumo":
    default: {
      const data = await getRelatoriosData(meses);
      const linhas: (string | number)[][] = [
        ["Indicador", "Valor"],
        ["Receita no período (R$)", numBR(data.receitaTotalPeriodo)],
        ["Margem no período (R$)", numBR(data.margemTotalPeriodo)],
        ["Ordens de serviço (total)", data.osTotal],
        ["A receber pendente (R$)", numBR(data.pagamentosPendentes.total)],
        ["Pagamentos em aberto (qtd)", data.pagamentosPendentes.quantidade],
        ["Peças em falta (qtd)", data.estoqueBaixo.length],
        ["Orçamentos aprovados", data.orcamentos.aprovados],
        ["Orçamentos rejeitados", data.orcamentos.rejeitados],
        [],
        ["Receita por mês", ""],
        ["Período", "Receita (R$)"],
        ...data.receitaPorMes.map((m) => [m.periodo, numBR(m.valor)]),
        [],
        ["Margem por mês", ""],
        ["Período", "Receita (R$)", "Custo peças (R$)", "Margem (R$)"],
        ...data.margemPorMes.map((m) => [
          m.periodo,
          numBR(m.receita),
          numBR(m.custo),
          numBR(m.margem),
        ]),
        [],
        ["Comissão por mecânico", ""],
        ["Mecânico", "Ordens", "Faturamento (R$)", "Comissão (%)", "Comissão (R$)"],
        ...data.comissaoMecanicos.map((d) => [
          d.nome,
          d.ordens,
          numBR(d.faturamento),
          numBR(d.comissaoPercent),
          numBR(d.comissao),
        ]),
      ];
      return respostaCsv(`relatorio-resumo-${meses}m.csv`, montarCsv(linhas));
    }
  }
}
