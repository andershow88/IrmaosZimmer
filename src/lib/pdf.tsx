// Geração de PDFs no servidor (orçamentos e recibos).
//
// IMPORTANTE — compatibilidade:
// @react-pdf/renderer tem histórico de problemas em rotas server-side do Next
// App Router com React 19 (ver issues diegomura/react-pdf #2966, #3074, #2756).
// Por isso esta implementação:
//   1) tenta gerar um PDF de verdade via @react-pdf/renderer (import dinâmico,
//      para não quebrar o build caso a lib falhe ao carregar);
//   2) se a lib falhar (carregamento ou render), cai para um FALLBACK HTML —
//      um documento HTML imprimível (Ctrl+P -> "Salvar como PDF") com os
//      mesmos dados. Quem chama deve usar `contentType` para servir corretamente.
//
// Assinatura estável para os chamadores:
//   renderOrcamentoPDF(data) / renderReciboPDF(data) -> RenderResult
// onde RenderResult.buffer é sempre um Buffer (PDF ou HTML) e
// RenderResult.contentType indica "application/pdf" ou "text/html".

import { formatBRL, formatDateBR } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos de dados de entrada
// ---------------------------------------------------------------------------

export type DocItem = {
  descricao: string;
  quantidade: number;
  valorUnitario: number | string;
  valorTotal?: number | string;
};

export type EmpresaInfo = {
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
};

export type OrcamentoPDFData = {
  numero: string | number;
  data: Date | string;
  empresa: EmpresaInfo;
  cliente: { nome: string; documento?: string; telefone?: string };
  veiculo?: { descricao?: string; placa?: string };
  itens: DocItem[];
  total: number | string;
  observacoes?: string;
  validade?: string;
};

export type ReciboPDFData = {
  numero: string | number;
  data: Date | string;
  empresa: EmpresaInfo;
  cliente: { nome: string; documento?: string };
  descricao: string;
  valor: number | string;
  formaPagamento?: string;
};

export type RenderResult = {
  buffer: Buffer;
  contentType: "application/pdf" | "text/html";
  /** Sugestão de nome de arquivo (sem caminho). */
  filename: string;
  /** true quando caiu no fallback HTML. */
  fallback: boolean;
};

// ---------------------------------------------------------------------------
// Helpers de cálculo
// ---------------------------------------------------------------------------

function num(v: number | string | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^0-9,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function itemTotal(it: DocItem): number {
  if (it.valorTotal != null) return num(it.valorTotal);
  return it.quantidade * num(it.valorUnitario);
}

// ---------------------------------------------------------------------------
// Caminho principal: @react-pdf/renderer (import dinâmico)
// ---------------------------------------------------------------------------

/** Elemento <Document> aceito por renderToBuffer (DocumentProps). */
type DocElement = Parameters<
  typeof import("@react-pdf/renderer").renderToBuffer
>[0];

async function tryRenderPdf(
  build: (rp: typeof import("@react-pdf/renderer")) => DocElement
): Promise<Buffer | null> {
  try {
    const rp = await import("@react-pdf/renderer");
    const element = build(rp);
    // renderToBuffer existe no entrypoint Node da lib.
    const buffer = await rp.renderToBuffer(element);
    return Buffer.from(buffer);
  } catch (err) {
    console.error("[pdf] @react-pdf/renderer indisponível, usando fallback HTML:", err);
    return null;
  }
}

function orcamentoDoc(
  rp: typeof import("@react-pdf/renderer"),
  data: OrcamentoPDFData
): DocElement {
  const { Document, Page, View, Text, StyleSheet } = rp;
  const s = StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
    h1: { fontSize: 16, marginBottom: 4 },
    muted: { color: "#555" },
    section: { marginTop: 12 },
    row: { flexDirection: "row" },
    cellDesc: { flex: 4 },
    cellQtd: { flex: 1, textAlign: "right" },
    cellVal: { flex: 2, textAlign: "right" },
    th: {
      flexDirection: "row",
      borderBottom: 1,
      borderColor: "#000",
      paddingBottom: 2,
      marginTop: 6,
      fontWeight: 700,
    },
    tr: { flexDirection: "row", paddingVertical: 2, borderBottom: 0.5, borderColor: "#ccc" },
    total: { marginTop: 8, textAlign: "right", fontSize: 12 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{data.empresa.nome}</Text>
        {data.empresa.cnpj ? <Text style={s.muted}>CNPJ: {data.empresa.cnpj}</Text> : null}
        {data.empresa.endereco ? <Text style={s.muted}>{data.empresa.endereco}</Text> : null}
        {data.empresa.telefone ? <Text style={s.muted}>{data.empresa.telefone}</Text> : null}

        <View style={s.section}>
          <Text style={{ fontSize: 13 }}>Orçamento Nº {String(data.numero)}</Text>
          <Text style={s.muted}>Data: {formatDateBR(data.data)}</Text>
          {data.validade ? <Text style={s.muted}>Validade: {data.validade}</Text> : null}
        </View>

        <View style={s.section}>
          <Text>Cliente: {data.cliente.nome}</Text>
          {data.cliente.documento ? <Text style={s.muted}>Documento: {data.cliente.documento}</Text> : null}
          {data.cliente.telefone ? <Text style={s.muted}>Telefone: {data.cliente.telefone}</Text> : null}
          {data.veiculo?.descricao || data.veiculo?.placa ? (
            <Text style={s.muted}>
              Veículo: {data.veiculo?.descricao ?? ""} {data.veiculo?.placa ? `(${data.veiculo.placa})` : ""}
            </Text>
          ) : null}
        </View>

        <View style={s.th}>
          <Text style={s.cellDesc}>Descrição</Text>
          <Text style={s.cellQtd}>Qtd</Text>
          <Text style={s.cellVal}>Unitário</Text>
          <Text style={s.cellVal}>Total</Text>
        </View>
        {data.itens.map((it, i) => (
          <View style={s.tr} key={i}>
            <Text style={s.cellDesc}>{it.descricao}</Text>
            <Text style={s.cellQtd}>{it.quantidade}</Text>
            <Text style={s.cellVal}>{formatBRL(num(it.valorUnitario))}</Text>
            <Text style={s.cellVal}>{formatBRL(itemTotal(it))}</Text>
          </View>
        ))}

        <Text style={s.total}>Total: {formatBRL(num(data.total))}</Text>

        {data.observacoes ? (
          <View style={s.section}>
            <Text style={{ fontWeight: 700 }}>Observações</Text>
            <Text>{data.observacoes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function reciboDoc(
  rp: typeof import("@react-pdf/renderer"),
  data: ReciboPDFData
): DocElement {
  const { Document, Page, View, Text, StyleSheet } = rp;
  const s = StyleSheet.create({
    page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
    h1: { fontSize: 16, marginBottom: 4 },
    muted: { color: "#555" },
    section: { marginTop: 16 },
    valor: { fontSize: 18, marginTop: 12 },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{data.empresa.nome}</Text>
        {data.empresa.cnpj ? <Text style={s.muted}>CNPJ: {data.empresa.cnpj}</Text> : null}

        <View style={s.section}>
          <Text style={{ fontSize: 14 }}>Recibo Nº {String(data.numero)}</Text>
          <Text style={s.muted}>Data: {formatDateBR(data.data)}</Text>
        </View>

        <View style={s.section}>
          <Text>
            Recebemos de {data.cliente.nome}
            {data.cliente.documento ? ` (${data.cliente.documento})` : ""} a importância de:
          </Text>
          <Text style={s.valor}>{formatBRL(num(data.valor))}</Text>
          <Text style={{ marginTop: 8 }}>Referente a: {data.descricao}</Text>
          {data.formaPagamento ? (
            <Text style={s.muted}>Forma de pagamento: {data.formaPagamento}</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Fallback HTML imprimível
// ---------------------------------------------------------------------------

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlShell(titulo: string, corpo: string): Buffer {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;font-size:13px}
  h1{font-size:20px;margin:0 0 4px}
  .muted{color:#555}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{padding:4px 6px;border-bottom:1px solid #ccc;text-align:left}
  td.r,th.r{text-align:right}
  .total{margin-top:8px;text-align:right;font-size:15px;font-weight:bold}
  .section{margin-top:16px}
  @media print{body{margin:0;padding:24px}}
</style></head>
<body>${corpo}</body></html>`;
  return Buffer.from(html, "utf-8");
}

function orcamentoHtml(data: OrcamentoPDFData): Buffer {
  const linhas = data.itens
    .map(
      (it) =>
        `<tr><td>${esc(it.descricao)}</td><td class="r">${esc(it.quantidade)}</td>` +
        `<td class="r">${esc(formatBRL(num(it.valorUnitario)))}</td>` +
        `<td class="r">${esc(formatBRL(itemTotal(it)))}</td></tr>`
    )
    .join("");
  const corpo = `
    <h1>${esc(data.empresa.nome)}</h1>
    ${data.empresa.cnpj ? `<div class="muted">CNPJ: ${esc(data.empresa.cnpj)}</div>` : ""}
    ${data.empresa.endereco ? `<div class="muted">${esc(data.empresa.endereco)}</div>` : ""}
    <div class="section"><strong>Orçamento Nº ${esc(data.numero)}</strong>
      <div class="muted">Data: ${esc(formatDateBR(data.data))}</div></div>
    <div class="section">Cliente: ${esc(data.cliente.nome)}
      ${data.cliente.documento ? `<div class="muted">Documento: ${esc(data.cliente.documento)}</div>` : ""}</div>
    <table><thead><tr><th>Descrição</th><th class="r">Qtd</th><th class="r">Unitário</th><th class="r">Total</th></tr></thead>
    <tbody>${linhas}</tbody></table>
    <div class="total">Total: ${esc(formatBRL(num(data.total)))}</div>
    ${data.observacoes ? `<div class="section"><strong>Observações</strong><div>${esc(data.observacoes)}</div></div>` : ""}`;
  return htmlShell(`Orçamento ${data.numero}`, corpo);
}

function reciboHtml(data: ReciboPDFData): Buffer {
  const corpo = `
    <h1>${esc(data.empresa.nome)}</h1>
    ${data.empresa.cnpj ? `<div class="muted">CNPJ: ${esc(data.empresa.cnpj)}</div>` : ""}
    <div class="section"><strong>Recibo Nº ${esc(data.numero)}</strong>
      <div class="muted">Data: ${esc(formatDateBR(data.data))}</div></div>
    <div class="section">Recebemos de ${esc(data.cliente.nome)}
      ${data.cliente.documento ? `(${esc(data.cliente.documento)})` : ""} a importância de:
      <div class="total" style="text-align:left">${esc(formatBRL(num(data.valor)))}</div>
      <div>Referente a: ${esc(data.descricao)}</div>
      ${data.formaPagamento ? `<div class="muted">Forma de pagamento: ${esc(data.formaPagamento)}</div>` : ""}</div>`;
  return htmlShell(`Recibo ${data.numero}`, corpo);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export async function renderOrcamentoPDF(
  data: OrcamentoPDFData
): Promise<RenderResult> {
  const pdf = await tryRenderPdf((rp) => orcamentoDoc(rp, data));
  if (pdf) {
    return {
      buffer: pdf,
      contentType: "application/pdf",
      filename: `orcamento-${data.numero}.pdf`,
      fallback: false,
    };
  }
  return {
    buffer: orcamentoHtml(data),
    contentType: "text/html",
    filename: `orcamento-${data.numero}.html`,
    fallback: true,
  };
}

export async function renderReciboPDF(
  data: ReciboPDFData
): Promise<RenderResult> {
  const pdf = await tryRenderPdf((rp) => reciboDoc(rp, data));
  if (pdf) {
    return {
      buffer: pdf,
      contentType: "application/pdf",
      filename: `recibo-${data.numero}.pdf`,
      fallback: false,
    };
  }
  return {
    buffer: reciboHtml(data),
    contentType: "text/html",
    filename: `recibo-${data.numero}.html`,
    fallback: true,
  };
}
