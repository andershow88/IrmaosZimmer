import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  buscarCEP,
  buscarCNPJ,
  buscarMarcasFipe,
  buscarPrecoFipe,
  type TipoVeiculoFipe,
} from "@/lib/lookups";

export const dynamic = "force-dynamic";

const TIPOS_FIPE: TipoVeiculoFipe[] = ["carros", "motos", "caminhoes"];

/**
 * Rota de consultas a APIs públicas (CEP / CNPJ / FIPE) para uso nos
 * formulários do cliente. Mantém as chamadas externas no servidor (a lib
 * @/lib/lookups é "server-only") e devolve JSON pronto para o front.
 *
 * Uso:
 *  - GET /api/lookups?tipo=cep&cep=00000000
 *  - GET /api/lookups?tipo=cnpj&cnpj=00000000000000
 *  - GET /api/lookups?tipo=fipe&fipe=marcas&veiculo=carros
 *  - GET /api/lookups?tipo=fipe&fipe=preco&codigo=001234-5&ano=2020
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Evita abuso das APIs externas a partir de uma mesma sessão.
  const limited = rateLimit(`lookups:${session.id}`, 60, 60_000);
  if (!limited.ok) {
    return Response.json(
      { error: "Muitas consultas. Aguarde um instante e tente novamente." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const tipo = (searchParams.get("tipo") ?? "").toLowerCase();

  try {
    switch (tipo) {
      case "cep": {
        const cep = searchParams.get("cep") ?? "";
        if (!cep.replace(/\D/g, "")) {
          return Response.json({ error: "Informe o CEP." }, { status: 400 });
        }
        const data = await buscarCEP(cep);
        if (!data) {
          return Response.json(
            { error: "CEP não encontrado. Verifique e tente novamente." },
            { status: 404 }
          );
        }
        return Response.json({ data });
      }

      case "cnpj": {
        const cnpj = searchParams.get("cnpj") ?? "";
        if (!cnpj.replace(/\D/g, "")) {
          return Response.json({ error: "Informe o CNPJ." }, { status: 400 });
        }
        const data = await buscarCNPJ(cnpj);
        if (!data) {
          return Response.json(
            { error: "CNPJ não encontrado. Verifique e tente novamente." },
            { status: 404 }
          );
        }
        return Response.json({ data });
      }

      case "fipe": {
        const fipe = (searchParams.get("fipe") ?? "marcas").toLowerCase();

        if (fipe === "marcas") {
          const veiculoParam = (
            searchParams.get("veiculo") ?? "carros"
          ).toLowerCase() as TipoVeiculoFipe;
          const veiculo = TIPOS_FIPE.includes(veiculoParam)
            ? veiculoParam
            : "carros";
          const data = await buscarMarcasFipe(veiculo);
          return Response.json({ data });
        }

        if (fipe === "preco") {
          const codigo = searchParams.get("codigo") ?? "";
          if (!codigo.trim()) {
            return Response.json(
              { error: "Informe o código FIPE." },
              { status: 400 }
            );
          }
          const ano = searchParams.get("ano");
          const precos = await buscarPrecoFipe(codigo);
          const data =
            ano && ano.trim()
              ? precos.filter((p) => p.ano.startsWith(ano.trim()))
              : precos;
          if (data.length === 0) {
            return Response.json(
              { error: "Nenhum valor FIPE encontrado para esse código." },
              { status: 404 }
            );
          }
          return Response.json({ data });
        }

        return Response.json(
          { error: "Consulta FIPE inválida. Use fipe=marcas ou fipe=preco." },
          { status: 400 }
        );
      }

      default:
        return Response.json(
          { error: "Tipo de consulta inválido. Use tipo=cep, cnpj ou fipe." },
          { status: 400 }
        );
    }
  } catch {
    return Response.json(
      { error: "Falha na consulta. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
