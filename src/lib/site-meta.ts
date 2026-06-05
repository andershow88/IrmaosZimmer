// Metadados do SITE PÚBLICO (SEO / compartilhamento social).
// Base URL configurável por ambiente; fallback para o domínio institucional.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://irmaoszimmer.com.br"
).replace(/\/+$/, "");

/** Imagem padrão de compartilhamento (Open Graph / Twitter). */
export const OG_IMAGE = "/fotos/foto-1.png";

/** URL absoluta a partir de um caminho relativo do site. */
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * JSON-LD da oficina (schema.org/AutoRepair, subtipo de LocalBusiness).
 * `telephone`/`email` são opcionais (vêm de WorkshopSettings quando disponíveis).
 */
export function oficinaJsonLd(opts?: {
  telephone?: string | null;
  email?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: "Irmãos Zimmer LTDA",
    alternateName: "Irmãos Zimmer",
    description:
      "Oficina mecânica completa em Santa Maria do Herval (RS) desde 1988: mecânica geral, eletrônica embarcada, geometria, chapeação, autopeças e acessórios.",
    url: SITE_URL,
    image: siteUrl(OG_IMAGE),
    logo: siteUrl("/logo.png"),
    foundingDate: "1988",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Beno Closs, 2065 — Bairro Amizade",
      addressLocality: "Santa Maria do Herval",
      addressRegion: "RS",
      addressCountry: "BR",
    },
    areaServed: "Santa Maria do Herval e região (RS)",
    ...(opts?.telephone ? { telephone: opts.telephone } : {}),
    ...(opts?.email ? { email: opts.email } : {}),
  };
}

/** Constrói um BreadcrumbList JSON-LD a partir de pares [nome, caminho]. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}
