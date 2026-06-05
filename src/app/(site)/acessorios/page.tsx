import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Check, Car, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteIcon } from "@/components/site/site-icon";
import { ACCESSORIES } from "@/components/site/site-data";

export const metadata: Metadata = {
  title: "Acessórios",
  alternates: { canonical: "/acessorios" },
  description:
    "Instalação de acessórios automotivos na Irmãos Zimmer: alarme, insulfilm, sensor de estacionamento, som, travas e vidros elétricos. Mais conforto e segurança para o seu veículo.",
};

export default function AcessoriosPage() {
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
            <Car className="h-3.5 w-3.5" aria-hidden="true" />
            Mais conforto, segurança e tecnologia
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Acessórios para o seu veículo
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            Instalamos acessórios com qualidade e acabamento caprichado, deixando
            o seu carro mais confortável, seguro e do seu jeito. Conheça as
            opções e agende a instalação.
          </p>
          <div className="mt-7">
            <Link
              href="/agendar"
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "bg-white text-accent shadow-lg shadow-black/10 hover:bg-white/90"
              )}
            >
              <CalendarCheck className="h-5 w-5" />
              Agendar instalação
            </Link>
          </div>
        </div>
      </section>

      {/* Lista de acessórios */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            O que instalamos
          </h2>
          <p className="mt-3 text-muted">
            Soluções para deixar o seu veículo mais prático, seguro e agradável
            no dia a dia.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACCESSORIES.map((acc) => (
            <Card
              key={acc.slug}
              className="group flex flex-col p-6 transition hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <SiteIcon name={acc.icone} className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{acc.titulo}</h3>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                {acc.descricao}
              </p>

              <ul className="mt-5 space-y-2">
                {acc.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>{b}</span>
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
                Agendar {acc.titulo}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Card className="relative isolate overflow-hidden border-0 p-8 sm:p-12">
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-deep via-accent-2 to-accent-2"
            aria-hidden="true"
          />
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Quer instalar um acessório?
              </h2>
              <p className="mt-3 text-white/90">
                Fale com a Irmãos Zimmer e agende a instalação com quem entende
                de carro há mais de 35 anos.
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
