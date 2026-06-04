import type { Metadata } from "next";
import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import { AgendarForm } from "@/components/site/agendar-form";

export const metadata: Metadata = {
  title: "Agendar horário",
  description:
    "Solicite o agendamento do seu atendimento na oficina Irmãos Zimmer. Preencha o formulário e a nossa equipe entra em contato para confirmar.",
};

const VANTAGENS = [
  {
    icon: CalendarCheck,
    titulo: "Sem filas",
    texto: "Você escolhe a data e a hora que prefere; nós confirmamos.",
  },
  {
    icon: Clock,
    titulo: "Atendimento ágil",
    texto: "Mais de 35 anos de experiência cuidando do seu veículo.",
  },
  {
    icon: ShieldCheck,
    titulo: "Confiança",
    texto: "Oficina completa, peças de qualidade e equipe especializada.",
  },
];

export default function AgendarPage() {
  return (
    <div className="bg-bg">
      {/* Cabeçalho */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-accent-deep to-accent-2">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_25rem_at_80%_-10%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            <CalendarCheck className="h-3.5 w-3.5" />
            Agendamento online
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Agende o atendimento do seu veículo
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            Preencha os dados abaixo e a nossa equipe entrará em contato para
            confirmar o melhor horário. É rápido e sem compromisso.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Formulário */}
          <div>
            <AgendarForm />
          </div>

          {/* Coluna lateral informativa */}
          <aside className="space-y-4 lg:pt-2">
            {VANTAGENS.map((v) => (
              <div
                key={v.titulo}
                className="flex items-start gap-3 rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {v.titulo}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {v.texto}
                  </p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </div>
  );
}
