// API PÚBLICA: horários disponíveis para uma data (?data=YYYY-MM-DD).
// Usada pelo formulário do site para mostrar apenas os horários livres.
// Liberada pelo proxy: PUBLIC_API inclui "/api/agendar", que cobre as subrotas
// (a checagem usa pathname.startsWith(p + "/")), portanto "/api/agendar/slots"
// é público automaticamente.

import { getSlotsDisponiveis } from "@/server/agenda-disponibilidade";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Extrai um identificador de IP da requisição para o rate-limit. */
function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "desconhecido";
}

const DATA_RX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  // Rate-limit leve por IP: até 60 consultas por minuto (o usuário troca de
  // data várias vezes; é só leitura, então o limite é folgado).
  const ip = getClientIp(req);
  const limited = rateLimit(`agendar-slots:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Muitas consultas. Aguarde um instante e tente novamente." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const data = (searchParams.get("data") ?? "").trim();

  if (!DATA_RX.test(data)) {
    return Response.json(
      { ok: false, error: "Informe uma data válida (AAAA-MM-DD)." },
      { status: 400 }
    );
  }

  try {
    const slots = await getSlotsDisponiveis(data);
    return Response.json({ ok: true, data, slots });
  } catch (err) {
    console.error("[api/agendar/slots] erro ao calcular disponibilidade:", err);
    return Response.json(
      { ok: false, error: "Não foi possível carregar os horários agora. Tente novamente." },
      { status: 500 }
    );
  }
}
