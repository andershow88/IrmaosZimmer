// API PÚBLICA de agendamento online (sem sessão).
// Recebe a solicitação do formulário do site, valida, aplica rate-limit por IP,
// localiza/cria o cliente e o veículo e grava um Appointment com status AGENDADO,
// que aparece automaticamente na Agenda interna (/painel/agenda).

import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validação (mensagens em pt-BR)
// ---------------------------------------------------------------------------

const agendarSchema = z.object({
  nome: z
    .string({ required_error: "Informe o seu nome." })
    .trim()
    .min(2, "Informe o seu nome completo."),
  telefone: z
    .string({ required_error: "Informe o seu telefone/WhatsApp." })
    .trim()
    .min(8, "Informe um telefone/WhatsApp válido."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal("")),
  marca: z.string().trim().optional().or(z.literal("")),
  modelo: z.string().trim().optional().or(z.literal("")),
  placa: z.string().trim().optional().or(z.literal("")),
  servicoDesejado: z.string().trim().optional().or(z.literal("")),
  dataHora: z
    .string({ required_error: "Escolha a data e a hora desejadas." })
    .min(1, "Escolha a data e a hora desejadas."),
  mensagem: z.string().trim().max(2000, "Mensagem muito longa.").optional().or(z.literal("")),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar o uso dos seus dados (LGPD)." }),
  }),
  // Honeypot anti-spam: campo oculto que humanos não preenchem.
  website: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrai um identificador de IP da requisição para o rate-limit. */
function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "desconhecido";
}

/** Normaliza um telefone para comparação (apenas dígitos). */
function digits(value: string): string {
  return value.replace(/\D/g, "");
}

const CIDADE_PADRAO = "Santa Maria do Herval";
const ESTADO_PADRAO = "RS";

export async function POST(req: Request) {
  // Rate-limit por IP: até 5 solicitações por minuto.
  const ip = getClientIp(req);
  const limited = rateLimit(`agendar:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Muitas solicitações. Aguarde um instante e tente novamente." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = agendarSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json(
      { ok: false, error: "Verifique os campos destacados.", fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot preenchido -> provável bot. Finge sucesso (não grava nada).
  if (data.website && data.website.trim().length > 0) {
    return Response.json({ ok: true });
  }

  // Valida a data/hora (datetime-local) antes de tocar no banco.
  const dataHora = new Date(data.dataHora);
  if (Number.isNaN(dataHora.getTime())) {
    return Response.json(
      { ok: false, error: "Data/hora inválida.", fieldErrors: { dataHora: "Data/hora inválida." } },
      { status: 400 }
    );
  }

  const telefone = data.telefone.trim();
  const email = data.email?.trim() || null;
  const marca = data.marca?.trim() || "";
  const modelo = data.modelo?.trim() || "";
  const placa = data.placa?.trim() || "";
  const servicoDesejado = data.servicoDesejado?.trim() || null;
  const mensagem = data.mensagem?.trim() || "";

  try {
    // 1) Localiza o cliente por telefone OU whatsapp (comparando só dígitos).
    const tel = digits(telefone);
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { telefone: { contains: tel.length >= 8 ? tel.slice(-8) : tel } },
          { whatsapp: { contains: tel.length >= 8 ? tel.slice(-8) : tel } },
        ],
      },
    });

    // 2) Cria o cliente se não existir.
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          nome: data.nome.trim(),
          telefone,
          whatsapp: telefone,
          email,
          cidade: CIDADE_PADRAO,
          estado: ESTADO_PADRAO,
          lgpdConsent: true,
        },
      });
    }

    // 3) Cria o veículo (se informado o suficiente para identificá-lo).
    let vehicleId: string | undefined;
    if (marca || modelo || placa) {
      const vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          marca: marca || "Não informada",
          modelo: modelo || "Não informado",
          placa: placa || "",
        },
      });
      vehicleId = vehicle.id;
    }

    // 4) Monta as observações.
    const obsLinhas = ["Solicitado pelo site"];
    if (mensagem) obsLinhas.push(`Mensagem do cliente: ${mensagem}`);
    if (email) obsLinhas.push(`E-mail: ${email}`);

    // 5) Cria o agendamento (status AGENDADO -> aparece na agenda interna).
    await prisma.appointment.create({
      data: {
        customerId: customer.id,
        vehicleId,
        servicoDesejado,
        dataHora,
        status: "AGENDADO",
        observacoes: obsLinhas.join("\n"),
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/agendar] erro ao registrar agendamento:", err);
    return Response.json(
      {
        ok: false,
        error: "Não foi possível registrar a solicitação agora. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}
