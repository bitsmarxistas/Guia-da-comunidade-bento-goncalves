import type { Metadata } from "next";
import { CatalogoView } from "../_components/catalogo-view";

export const metadata: Metadata = {
  title: "Busca",
  description: "Busque comércios e serviços de Bento Gonçalves.",
  robots: { index: false, follow: true },
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
