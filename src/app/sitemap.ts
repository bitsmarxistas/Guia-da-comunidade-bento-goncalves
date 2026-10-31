import type { MetadataRoute } from "next";
import { listarNegociosPublicadosParaSitemap } from "@/application/catalogo";
import { listarTermosVigentes } from "@/application/termos/publicos";

export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://guiabg.com.br"
).replace(/\/+$/, "");

function dataMaisRecente(datas: Date[]): Date | undefined {
  const validas = datas.filter((data) => !Number.isNaN(data.getTime()));
  if (validas.length === 0) return undefined;

  return new Date(Math.max(...validas.map((data) => data.getTime())));
}

/**
 * Sitemap somente com URLs canônicas. As variantes /catalogo?categoria=... são
 * rastreáveis, mas o canonical delas é /catalogo — por isso ficam fora daqui
 * (sitemap com URL não canônica manda sinais contraditórios ao buscador).
 * /busca, /login, /recuperar-senha, /admin e /api nunca entram.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [negocios, termos] = await Promise.all([
    listarNegociosPublicadosParaSitemap(),
    listarTermosVigentes([
      "termos_uso",
      "politica_privacidade",
      "tratamento_dados",
    ]),
  ]);

  const atualizacaoDosNegocios = dataMaisRecente(
    negocios.map((negocio) => negocio.atualizadoEm),
  );
  const atualizacaoDosTermos = dataMaisRecente(
    termos
      .filter((termo) => termo.tipo === "termos_uso")
      .map((termo) => termo.publicadoEm),
  );
  const atualizacaoDaPrivacidade = dataMaisRecente(
    termos
      .filter(
        (termo) =>
          termo.tipo === "politica_privacidade" ||
          termo.tipo === "tratamento_dados",
      )
      .map((termo) => termo.publicadoEm),
  );

  const estaticas: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: atualizacaoDosNegocios,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: atualizacaoDosNegocios,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/solicitar`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: atualizacaoDosTermos,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: atualizacaoDaPrivacidade,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const negociosUrls: MetadataRoute.Sitemap = negocios.map((negocio) => ({
    url: `${SITE_URL}/negocio/${encodeURIComponent(negocio.slug)}`,
    lastModified: negocio.atualizadoEm,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...estaticas, ...negociosUrls];
}
