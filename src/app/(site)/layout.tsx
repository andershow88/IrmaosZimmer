import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { SITE_URL, OG_IMAGE } from "@/lib/site-meta";

const TITLE_DEFAULT =
  "Irmãos Zimmer — Oficina Mecânica em Santa Maria do Herval";
const DESCRIPTION =
  "Oficina completa com mais de 35 anos de tradição em Santa Maria do Herval (RS): mecânica geral, eletrônica embarcada, geometria, autopeças e acessórios.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: "%s · Irmãos Zimmer",
  },
  description: DESCRIPTION,
  applicationName: "Irmãos Zimmer",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Irmãos Zimmer",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Oficina Irmãos Zimmer — Santa Maria do Herval (RS)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// O número do WhatsApp vem do banco (WorkshopSettings) por requisição.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resiliente: uma falha de banco não pode derrubar o site público — apenas
  // omite o botão flutuante de WhatsApp.
  let whatsapp: string | null = null;
  try {
    const settings = await prisma.workshopSettings.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { whatsapp: true },
    });
    whatsapp = settings?.whatsapp?.trim() || null;
  } catch {
    whatsapp = null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingWhatsApp phone={whatsapp} />
    </div>
  );
}
