import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZimmerOS AI — Gestão Inteligente para Oficina Mecânica",
  description:
    "Sistema de gestão da oficina Irmãos Zimmer: clientes, veículos, ordens de serviço, orçamentos, agenda, estoque e assistente de IA.",
  applicationName: "ZimmerOS AI",
};

export const viewport: Viewport = {
  themeColor: "#1B4D89",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zimmeros-theme');if(!t||t==='system'){var m=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',m?'dark':'light');}else{document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
