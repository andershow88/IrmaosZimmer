import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-meta";

/** Sitemap do site público (rotas (site)). O painel/API ficam fora (ver robots). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const rotas: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 0.8, changeFrequency: "monthly" },
    { path: "/agendar", priority: 0.9, changeFrequency: "weekly" },
    { path: "/servicos", priority: 0.7, changeFrequency: "monthly" },
    { path: "/acessorios", priority: 0.7, changeFrequency: "monthly" },
    { path: "/sobre", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contato", priority: 0.8, changeFrequency: "monthly" },
  ];

  return rotas.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
