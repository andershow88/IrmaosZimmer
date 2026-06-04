import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Check, ShieldCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteIcon } from "@/components/site/site-icon";
import { SERVICE_CATEGORIES, PARTNERS, EMPRESA } from "@/components/site/site-data";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Conheça os serviços da Irmãos Zimmer: mecânica geral, eletrônica embarcada, serviços rápidos, geometria, chapeação, autopeças e acessórios. Oficina completa em Santa Maria do Herval (RS).",
};

export default function ServicosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-deep via-accent-2 to-accent-2 opacity-90"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_28rem_at_90%_-10%,rgba(255,255,255,0.18),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Oficina completa desde {EMPRESA.fundacao}
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Serviços para o seu veículo rodar com segurança
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            Da mecânica geral à eletrônica embarcada, cuidamos de tudo com
            diagnóstico preciso, peças de qualidade e mais de 35 anos de
            tradição. Confira nossas especialidades e agende o seu atendimento.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/agendar"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "bg-white text-accent shadow-lg shadow-black/10 hover:bg-white/90"
              )}
            >
              <CalendarCheck className="h-5 w-5" />
              Agendar atendimento
            </Link>
            <Link
              href="/contato"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/60 bg-transparent text-white hover:bg-white/10"
              )}
            >
              Falar com a oficina
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias de serviço */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Nossas especialidades
          </h2>
          <p className="mt-3 text-muted">
            Organizamos nossos serviços por categoria para você encontrar
            rapidamente o que o seu carro precisa.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <Card
              key={cat.slug}
              className="group flex flex-col p-6 transition hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <SiteIcon name={cat.icone} className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{cat.titulo}</h3>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                {cat.descricao}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {cat.itens.map((item) => (
                  <li key={item}>
                    <Badge variant="default" className="bg-surface-2/70">
                      <Check className="h-3 w-3 text-accent" />
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />

              <Link
                href="/agendar"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "mt-2 w-full justify-center"
                )}
              >
                <CalendarCheck className="h-4 w-4" />
                Agendar {cat.titulo}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Parceiros / qualidade */}
      <section className="border-y border-border/70 bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Qualidade e parcerias de confiança
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Trabalhamos com parceiros reconhecidos no mercado para garantir
                serviço autorizado e atendimento de quem você pode confiar.
              </p>
            </div>
            <ul className="grid w-full max-w-md gap-3 sm:grid-cols-2">
              {PARTNERS.map((p) => (
                <li key={p.nome}>
                  <Card className="flex items-start gap-3 p-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {p.nome}
                      </span>
                      <span className="block text-xs text-muted">
                        {p.descricao}
                      </span>
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Card className="relative isolate overflow-hidden border-0 p-8 sm:p-12">
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-deep via-accent-2 to-accent-2"
            aria-hidden="true"
          />
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Pronto para cuidar do seu carro?
              </h2>
              <p className="mt-3 text-white/90">
                Agende um horário com a Irmãos Zimmer e conte com mais de 35 anos
                de experiência cuidando do seu veículo.
              </p>
            </div>
            <Link
              href="/agendar"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "shrink-0 bg-white text-accent shadow-lg shadow-black/10 hover:bg-white/90"
              )}
            >
              Agendar agora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
