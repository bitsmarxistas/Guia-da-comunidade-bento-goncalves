import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://guiabg.com.br"
).replace(/\/+$/, "");

// A diretiva Host (Yandex) espera só o host, sem esquema.
const HOST = new URL(SITE_URL).host;

/**
 * Área pública liberada; painel, autenticação, busca interna e API fora do
 * índice. /busca também responde noindex (defesa em profundidade), porque
 * robots.txt impede o rastreio, mas não remove uma URL já indexada.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/login", "/recuperar-senha", "/busca"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: HOST,
  };
}
