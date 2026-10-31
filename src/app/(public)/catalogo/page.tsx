import type { Metadata } from "next";
import { CatalogoView } from "../_components/catalogo-view";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explore comércios e serviços de Bento Gonçalves por categoria e bairro.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
