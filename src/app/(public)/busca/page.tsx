import type { Metadata } from "next";
import { CatalogoView } from "../_components/catalogo-view";

const DESCRICAO =
  "Busque comércios e serviços de Bento Gonçalves por nome, categoria ou bairro. Resultados do guia comunitário da cidade, atualizados pela comunidade.";

export const metadata: Metadata = {
  title: "Busca no guia",
  description: DESCRICAO,
  alternates: { canonical: "/busca" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Busca no GuiaBG",
    description: DESCRICAO,
    url: "/busca",
    type: "website",
    siteName: "GuiaBG",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Busca no GuiaBG",
    description: DESCRICAO,
  },
};

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <CatalogoView
      basePath="/busca"
      searchParams={params}
      titulo="Busca"
      descricao="Procure por nome, descrição ou categoria e refine por bairro."
    />
  );
}
