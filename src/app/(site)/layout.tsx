import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Irmãos Zimmer — Oficina Mecânica em Santa Maria do Herval",
    template: "%s · Irmãos Zimmer",
  },
  description:
    "Oficina completa com mais de 35 anos de tradição em Santa Maria do Herval (RS): mecânica geral, eletrônica embarcada, geometria, autopeças e acessórios.",
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
