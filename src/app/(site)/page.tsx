import Link from "next/link";
import {
  Wrench,
  CircuitBoard,
  Gauge,
  Crosshair,
  PaintRoller,
  Package,
  Car,
  CalendarCheck,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Clock4,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SERVICOS = [
  {
    icon: Wrench,
    titulo: "Mecânica Geral",
    descricao: "Motor, suspensão, freios, direção, transmissão e diferencial.",
  },
  {
    icon: CircuitBoard,
    titulo: "Eletrônica Embarcada",
    descricao: "Injeção, ABS/ESP, air bag, alternador, partida e sistemas elétricos.",
  },
  {
    icon: Gauge,
    titulo: "Serviços Rápidos",
    descricao: "Troca de óleo com checklist, balanceamento, escapamento e pneus.",
  },
  {
    icon: Crosshair,
    titulo: "Geometria",
    descricao: "Alinhamento 3D e computadorizado com precisão.",
  },
  {
    icon: PaintRoller,
    titulo: "Chapeação & Pintura",
    descricao: "Recuperação, alinhamento de chassi, pintura e polimento.",
  },
  {
    icon: Package,
    titulo: "Autopeças",
    descricao: "Peças em geral com qualidade e procedência garantida.",
  },
] as const;

const DIFERENCIAIS = [
  {
    icon: Award,
    titulo: "Tradição desde 1988",
    descricao:
      "Fundada pelos irmãos Zimmer, somam-se mais de 35 anos de experiência atendendo a região com seriedade.",
  },
  {
    icon: ShieldCheck,
    titulo: "Qualidade Bosch",
    descricao:
      "Serviço especializado em bombas e injeção com a tecnologia e o padrão de qualidade Bosch.",
  },
  {
    icon: Car,
    titulo: "Parceria HDI Seguros",
    descricao:
      "Atendimento a sinistros e reparos com o respaldo da parceria com a HDI Seguros.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent-deep via-accent-2 to-accent-2" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_85%_-10%,rgba(255,255,255,0.18),transparent_60%)]" />

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Clock4 className="h-3.5 w-3.5" />
              Mais de 35 anos de tradição
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Cuidamos do seu veículo do motor à pintura.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90">
              Oficina completa em Santa Maria do Herval (RS): mecânica geral,
              eletrônica embarcada, geometria, chapeação, autopeças e acessórios.
              Confiança que vem desde 1988.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                href="/servicos"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/40 bg-white/10 text-white hover:bg-white/20"
                )}
              >
                Conheça os serviços
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS RESUMIDOS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            O que fazemos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Uma estrutura completa para manter o seu carro seguro, eficiente e
            sempre pronto para a estrada.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICOS.map((servico) => (
            <Card
              key={servico.titulo}
              className="group p-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                <servico.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {servico.titulo}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {servico.descricao}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/servicos"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Ver todos os serviços
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* POR QUE A IRMÃOS ZIMMER */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Por que a Irmãos Zimmer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Experiência de família, tecnologia de ponta e parcerias que dão
              segurança a cada serviço.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {DIFERENCIAIS.map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-border bg-bg-elevated p-7 text-center shadow-sm"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-deep to-accent-2 text-white shadow-md shadow-accent/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {item.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCALIZAÇÃO + CTA CONTATO */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-bg-elevated shadow-sm">
          <div className="grid gap-8 p-8 sm:p-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                <MapPin className="h-3.5 w-3.5" />
                Santa Maria do Herval / RS
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Venha nos visitar
              </h2>
              <p className="mt-3 text-muted">
                Estamos na Rua Beno Closs, 2065, Bairro Amizade. Traga o seu
                veículo para uma avaliação ou agende um horário e evite filas.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/agendar"
                  className={cn(buttonVariants({ size: "md" }))}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Agendar horário
                </Link>
                <Link
                  href="/contato"
                  className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
                >
                  <Phone className="h-4 w-4" />
                  Falar com a oficina
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[14rem] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-deep to-accent-2 p-8 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(20rem_15rem_at_20%_120%,rgba(255,255,255,0.2),transparent_60%)]" />
              <div className="relative text-white">
                <MapPin className="mx-auto h-9 w-9" />
                <p className="mt-4 text-lg font-semibold">Rua Beno Closs, 2065</p>
                <p className="text-sm text-white/90">
                  Bairro Amizade · Santa Maria do Herval / RS
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
