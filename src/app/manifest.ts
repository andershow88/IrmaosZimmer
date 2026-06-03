import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZimmerOS AI — Irmãos Zimmer",
    short_name: "ZimmerOS AI",
    description: "Gestão Inteligente para Oficina Mecânica — Irmãos Zimmer",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#00a651",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
