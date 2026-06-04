import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  CalendarCheck,
  Navigation,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { waLink } from "@/lib/whatsapp";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contato e Localização · Irmãos Zimmer",
  description:
    "Fale com a oficina Irmãos Zimmer em Santa Maria do Herval (RS). Endereço, telefone, WhatsApp, horários e mapa de como chegar.",
};

// Endereço real da oficina (fallback caso WorkshopSettings esteja vazio).
const ENDERECO_FALLBACK = {
  nome: "Irmãos Zimmer LTDA",
  endereco: "Rua Beno Closs, 2065, Bairro Amizade",
  cidade: "Santa Maria do Herval",
  estado: "RS",
};

// Consulta usada pelo iframe do Google Maps (sem API key).
const MAPS_QUERY = "Rua+Beno+Closs+2065+Santa+Maria+do+Herval";
const MAPS_EMBED_URL = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

function temValor(v?: string | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export default async function ContatoPage() {
  const settings = await prisma.workshopSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const nome = temValor(settings?.nome) ? settings!.nome : ENDERECO_FALLBACK.nome;

  // Monta as linhas de endereço a partir das configurações, com fallback ao endereço real.
  const enderecoLinhas: string[] = [];
  if (temValor(settings?.endereco) || temValor(settings?.cidade)) {
    if (temValor(settings?.endereco)) enderecoLinhas.push(settings!.endereco!.trim());
    const cidade = temValor(settings?.cidade) ? settings!.cidade!.trim() : "";
    const estado = temValor(settings?.estado) ? settings!.estado!.trim() : "";
    const cep = temValor(settings?.cep) ? settings!.cep!.trim() : "";
    const linhaCidade = [cidade, estado].filter(Boolean).join(" / ");
    if (linhaCidade) enderecoLinhas.push(cep ? `${linhaCidade} — ${cep}` : linhaCidade);
  } else {
    enderecoLinhas.push(ENDERECO_FALLBACK.endereco);
    enderecoLinhas.push(`${ENDERECO_FALLBACK.cidade} / ${ENDERECO_FALLBACK.estado}`);
  }

  const telefone = temValor(settings?.telefone) ? settings!.telefone!.trim() : null;
  const whatsapp = temValor(settings?.whatsapp) ? settings!.whatsapp!.trim() : null;
  const email = temValor(settings?.email) ? settings!.email!.trim() : null;
  const horarios = temValor(settings?.horarios) ? settings!.horarios!.trim() : null;

  const waHref = whatsapp
    ? waLink(
        whatsapp,
        `Olá! Vim pelo site da ${nome} e gostaria de mais informações.`
      )
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Cabeçalho da página */}
      <header className="mb-10 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <MapPin className="h-3.5 w-3.5" />
          Contato e Localização
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Fale com a {nome}
        </h1>
        <p className="mt-3 text-base text-muted">
          Estamos em Santa Maria do Herval (RS) há mais de 35 anos. Venha tomar
          um café, agendar um serviço ou tirar suas dúvidas — será um prazer
          atender você.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna de informações de contato */}
        <section className="space-y-4">
          {/* Endereço */}
          <article className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Endereço</h2>
                <address className="mt-1 not-italic text-sm leading-relaxed text-muted">
                  {enderecoLinhas.map((linha) => (
                    <span key={linha} className="block">
                      {linha}
                    </span>
                  ))}
                </address>
                <a
                  href={MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-2"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Como chegar
                </a>
              </div>
            </div>
          </article>

          {/* Telefone */}
          <article className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Telefone</h2>
                {telefone ? (
                  <a
                    href={`tel:${telefone.replace(/[^\d+]/g, "")}`}
                    className="mt-1 block text-sm font-medium text-foreground hover:text-accent"
                  >
                    {telefone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-subtle">Em breve.</p>
                )}
              </div>
            </div>
          </article>

          {/* WhatsApp */}
          <article className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">WhatsApp</h2>
                {waHref ? (
                  <>
                    <p className="mt-1 text-sm text-muted">{whatsapp}</p>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ size: "sm", className: "mt-3" })}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Conversar no WhatsApp
                    </a>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-subtle">Em breve.</p>
                )}
              </div>
            </div>
          </article>

          {/* E-mail */}
          <article className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">E-mail</h2>
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="mt-1 block break-all text-sm font-medium text-foreground hover:text-accent"
                  >
                    {email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-subtle">Em breve.</p>
                )}
              </div>
            </div>
          </article>

          {/* Horários */}
          <article className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Horário de atendimento
                </h2>
                {horarios ? (
                  <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
                    {horarios}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-subtle">Em breve.</p>
                )}
              </div>
            </div>
          </article>
        </section>

        {/* Coluna do mapa + CTA */}
        <section className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-sm">
            <div className="aspect-[4/3] w-full">
              <iframe
                title={`Mapa de localização da ${nome}`}
                src={MAPS_EMBED_URL}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          {/* CTA Agendar */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent-deep to-accent-2 p-6 text-white shadow-md sm:p-8">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <CalendarCheck className="h-3.5 w-3.5" />
                Agendamento online
              </div>
              <h2 className="mt-4 text-2xl font-bold">Pronto para cuidar do seu carro?</h2>
              <p className="mt-2 max-w-md text-sm text-white/90">
                Agende seu serviço sem complicação. Escolha o melhor horário e
                deixe o resto com a gente.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/agendar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-accent-2 shadow-sm transition hover:bg-white/90"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Agendar agora
                </Link>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
            {/* Brilho decorativo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
