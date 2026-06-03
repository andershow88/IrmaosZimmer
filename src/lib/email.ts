import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

// Envio de e-mail via SMTP, condicionado a variáveis de ambiente.
// Sem SMTP_HOST configurado, NÃO envia: apenas loga e retorna { mock: true }.
// Isso permite desenvolvimento local sem servidor de e-mail.

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  /** Sobrescreve o remetente padrão (SMTP_FROM). */
  from?: string;
};

export type SendEmailResult =
  | { ok: true; mock: true; messageId: null }
  | { ok: true; mock: false; messageId: string }
  | { ok: false; mock: false; messageId: null; error: string };

let transporter: Transporter | null = null;

/** true quando há configuração SMTP suficiente no ambiente. */
export function isEmailAvailable(): boolean {
  return !!process.env.SMTP_HOST;
}

function getTransporter(): Transporter | null {
  if (!isEmailAvailable()) return null;
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 normalmente usa TLS implícito (secure: true).
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

/**
 * Envia um e-mail. Sem SMTP configurado, retorna { mock: true } e loga.
 * Nunca lança: erros de envio voltam como { ok: false }.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const t = getTransporter();
  const from =
    input.from ?? process.env.SMTP_FROM ?? "ZimmerOS <nao-responda@zimmeros>";

  if (!t) {
    console.info(
      "[email] SMTP não configurado — e-mail NÃO enviado (mock).",
      {
        to: input.to,
        subject: input.subject,
        anexos: input.attachments?.map((a) => a.filename),
      }
    );
    return { ok: true, mock: true, messageId: null };
  }

  try {
    const info = await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });
    return { ok: true, mock: false, messageId: info.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Erro ao enviar e-mail.";
    console.error("[email] falha no envio:", error);
    return { ok: false, mock: false, messageId: null, error };
  }
}
