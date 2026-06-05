import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-meta";

/** robots.txt: indexa o site público; bloqueia painel interno, API e login. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/api/", "/entrar"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
