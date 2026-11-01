import { eq, or } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { negocio } from "@/infrastructure/db/schema/negocio";

/**
 * Lê o comércio com as relações que o formulário do admin precisa.
 *
 * Aceita id OU slug: a fila de imagens linka a ficha pelo slug, e a consulta
 * antiga só comparava com o id (o link caía em "não encontrado").
 */
export async function buscarNegocioPorSlugId(idOuSlug: string) {
  const pareceId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOuSlug,
    );

  return db.query.negocio.findFirst({
    where: (n, { eq }) =>
      pareceId ? eq(n.id, idOuSlug) : eq(n.slug, idOuSlug),
    with: {
      contatos: true,
      localizacao: true,
      horarios: true,
      categorias: true,
    },
  });
}
