import type { Metadata } from "next";
import Link from "next/link";
import {
  Flag,
  Package,
  Users,
  CalendarCheck,
  Handshake,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FotoCarousel } from "@/components/site/foto-carousel";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "A Empresa",
  alternates: { canonical: "/sobre" },
  description:
    "Conheça a história da Irmãos Zimmer LTDA: fundada em 1988 em Santa Maria do Herval (RS), mais de 35 anos de tradição em oficina mecânica completa.",
};

const TIMELINE = [
  {
    ano: "1988",
    icon: Flag,
    titulo: "O começo",
    descricao:
      "Os irmãos Marcelino, Paulo e Marino Zimmer fundam a Irmãos Zimmer LTDA em Santa Maria do Herval (RS), na Rua Beno Closs, 2065, Bairro Amizade.",
  },
  {
    ano: "1990",
    icon: Package,
    titulo: "Setor de autopeças",
    descricao:
      "É implantado o setor de autopeças, ampliando o atendimento e oferecendo peças de qualidade junto aos serviços de oficina.",
  },
  {
    ano: "1992",
    icon: Users,
    titulo: "Chega o 4º sócio",
    descricao:
      "Anivo Zimmer junta-se à sociedade, reforçando o caráter familiar do negócio e a capacidade de atendimento.",
  },
] as const;

const VALORES = [
  {
    icon: HeartHandshake,
    titulo: "Compromisso familiar",
    descricao:
      "Um negócio construído entre irmãos, com o cuidado e a responsabilidade de quem atende como família.",
  },
  {
    icon: ShieldCheck,
    titulo: "Qualidade garantida",
    descricao:
      "Serviços com padrão Bosch e parceria HDI Seguros, sempre prezando pela segurança do cliente.",
  },
  {
    icon: Sparkles,
    titulo: "Atendimento completo",
    descricao:
      "Da mecânica geral à eletrônica embarcada, geometria, chapeação, autopeças e acessórios — tudo em um só lugar.",
  },
  {
    icon: Handshake,
    titulo: "Confiança regional",
    descricao:
      "Mais de três décadas conquistando a confiança dos motoristas de Santa Maria do Herval e região.",
  },
] as const;

export default function SobrePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-deep via-accent-2 to-accent-2" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_85%_-10%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Award className="h-3.5 w-3.5" />
            Desde 1988
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            A história da Irmãos Zimmer
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
            Uma oficina de família que se tornou referência em Santa Maria do
            Herval. Mais de 35 anos cuidando dos veículos da região com
            seriedade, técnica e atendimento próximo.
          </p>
        </div>
      </section>

      {/* INTRODUÇÃO + DESTAQUE +35 ANOS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="prose-zimmer">
            <p className="text-lg leading-relaxed text-foreground">
              A <strong>Irmãos Zimmer LTDA</strong> nasceu em 1988, fruto do
              trabalho e da visão dos irmãos Marcelino, Paulo e Marino Zimmer.
              Instalada na Rua Beno Closs, 2065, no Bairro Amizade, em Santa Maria
              do Herval (RS), começou como uma oficina mecânica dedicada a atender
              a comunidade local com honestidade e qualidade.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Com o crescimento da demanda, a empresa foi se estruturando para
              oferecer um atendimento cada vez mais completo — da mecânica geral à
              eletrônica embarcada, passando por geometria, chapeação, pintura,
              autopeças e acessórios. Hoje, a Irmãos Zimmer é uma oficina completa,
              preparada para cuidar do seu veículo do início ao fim.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-accent-deep to-accent-2 px-5 py-3 text-white shadow-md shadow-accent/20">
              <span className="text-3xl font-extrabold leading-none">+35</span>
              <span className="text-xs font-medium uppercase leading-tight tracking-wide text-white/90">
                anos de
                <br />
                tradição
              </span>
            </div>
          </div>

          <FotoCarousel
            images={[
              { src: "/fotos/foto-2-1.png", caption: "Os irmãos Zimmer", alt: "Os irmãos Zimmer na oficina" },
              { src: "/fotos/foto-2-2.png", caption: "Nossa equipe", alt: "Equipe da Irmãos Zimmer com a bandeira da empresa" },
            ]}
          />
        </div>
      </section>

      {/* LINHA DO TEMPO */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Nossa trajetória
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Os marcos que construíram a oficina que você conhece hoje.
            </p>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {TIMELINE.map((item) => (
              <li
                key={item.ano}
                className="relative rounded-2xl border border-border bg-bg-elevated p-7 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-accent">
                    {item.ano}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {item.titulo}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {item.descricao}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VALORES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Nossos valores
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            O que nos move desde o primeiro dia.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALORES.map((valor) => (
            <div
              key={valor.titulo}
              className="flex gap-4 rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <valor.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {valor.titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {valor.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-deep to-accent-2 p-10 text-center text-white shadow-md shadow-accent/20">
          <div className="absolute inset-0 bg-[radial-gradient(30rem_20rem_at_80%_120%,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Faça parte dessa história
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Agende um horário e descubra por que tantas famílias confiam seus
              veículos à Irmãos Zimmer há mais de 35 anos.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/agendar"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-accent shadow-lg shadow-black/10 hover:bg-white/90"
                )}
              >
                <CalendarCheck className="h-5 w-5" />
                Agendar horário
              </Link>
              <Link
                href="/contato"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/40 bg-white/10 text-white hover:bg-white/20"
                )}
              >
                Entrar em contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
