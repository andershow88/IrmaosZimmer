import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { prisma } from "@/lib/db";

// Endereço real da Irmãos Zimmer — usado como fallback caso WorkshopSettings
// não tenha os dados preenchidos.
const FALLBACK = {
  nome: "Irmãos Zimmer LTDA",
  endereco: "Rua Beno Closs, 2065",
  bairro: "Bairro Amizade",
  cidade: "Santa Maria do Herval",
  estado: "RS",
} as const;

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "A Empresa" },
  { href: "/servicos", label: "Serviços" },
  { href: "/acessorios", label: "Acessórios" },
  { href: "/contato", label: "Contato" },
  { href: "/agendar", label: "Agendar horário" },
] as const;

export async function SiteFooter() {
  let settings: Awaited<ReturnType<typeof prisma.workshopSettings.findFirst>> = null;
  try {
    settings = await prisma.workshopSettings.findFirst();
  } catch {
    // Sem banco disponível: cai no fallback estático.
    settings = null;
  }

  const nome = settings?.nome?.trim() || FALLBACK.nome;

  // Linha de endereço: prioriza WorkshopSettings, com fallback ao endereço real.
  const ruaLinha = settings?.endereco?.trim() || `${FALLBACK.endereco}, ${FALLBACK.bairro}`;
  const cidadeEstado = [settings?.cidade?.trim(), settings?.estado?.trim()]
    .filter(Boolean)
    .join(" / ");
  const cidadeLinha = cidadeEstado || `${FALLBACK.cidade} / ${FALLBACK.estado}`;
  const cep = settings?.cep?.trim();

  const telefone = settings?.telefone?.trim() || settings?.whatsapp?.trim();
  const email = settings?.email?.trim();
  const horarios = settings?.horarios?.trim();

  const semContato = !telefone && !email && !horarios;
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca + descrição */}
          <div className="space-y-4">
            <img
              src="/logo.png"
              alt="Mecânica Irmãos Zimmer"
              loading="lazy"
              decoding="async"
              className="logo-plate h-10 w-auto"
            />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Oficina completa em Santa Maria do Herval. Mais de 35 anos de
              tradição em mecânica, eletrônica embarcada, autopeças e acessórios.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Navegação</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato / localização */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Onde estamos</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  {ruaLinha}
                  <br />
                  {cidadeLinha}
                  {cep ? (
                    <>
                      <br />
                      CEP {cep}
                    </>
                  ) : null}
                </span>
              </li>

              {telefone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  <span>{telefone}</span>
                </li>
              )}

              {email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  <a
                    href={`mailto:${email}`}
                    className="transition hover:text-accent"
                  >
                    {email}
                  </a>
                </li>
              )}

              {horarios && (
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="whitespace-pre-line">{horarios}</span>
                </li>
              )}

              {semContato && (
                <li className="flex items-center gap-2.5 text-subtle">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Telefone e horários em breve.</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-subtle">
          © {ano} {nome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
