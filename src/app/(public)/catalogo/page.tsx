import type { Metadata } from "next";
import { CatalogoView } from "../_components/catalogo-view";

const DESCRICAO =
  "Explore comércios e serviços de Bento Gonçalves por categoria e bairro. Filtre por nome, veja contatos e horários e encontre o que precisa perto de você.";

type SearchParams = Record<string, string | string[] | undefined>;

function valores(valor: string | string[] | undefined): string[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor.filter(Boolean) : [valor];
}

function primeiro(valor: string | string[] | undefined): string {
  return valores(valor)[0] ?? "";
}

/**
 * O catálogo é uma página de resultados: a busca textual, a ordenação, a
 * paginação e a combinação de filtros geram variantes que não devem ser
 * indexadas. A categoria única continua rastreável, mas o canonical consolida
 * tudo em /catalogo para não dividir autoridade entre URLs quase idênticas.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const termo = primeiro(params.q).trim();
  const categorias = valores(params.categoria);
  const bairros = valores(params.bairro);
  const ordenacao = primeiro(params.ordem);
  const pagina = Number.parseInt(primeiro(params.pagina), 10);

  const ordenacaoNaoPadrao = Boolean(ordenacao) && ordenacao !== "relevancia";
  const filtrosCombinados =
    categorias.length + bairros.length + (ordenacaoNaoPadrao ? 1 : 0) >= 2;
  const paginaAvancada = Number.isInteger(pagina) && pagina > 1;
  const indexavel =
    !termo && !filtrosCombinados && !ordenacaoNaoPadrao && !paginaAvancada;

  return {
    title: "Catálogo de comércios e serviços",
    description: DESCRICAO,
    alternates: { canonical: "/catalogo" },
    robots: indexavel
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: "Catálogo de comércios e serviços",
      description: DESCRICAO,
      url: "/catalogo",
      type: "website",
      siteName: "GuiaBG",
      locale: "pt_BR",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Catálogo de comércios e serviços",
      description: DESCRICAO,
    },
  };
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <CatalogoView
      basePath="/catalogo"
      searchParams={params}
      titulo="Catálogo"
      descricao="Comércios e serviços da nossa comunidade. Use a busca e os filtros para encontrar o que precisa."
    />
  );
}
