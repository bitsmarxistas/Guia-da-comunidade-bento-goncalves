import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { negocio } from "@/infrastructure/db/schema/negocio";

/** Lê o comércio com as relações que o formulário do admin precisa. */
export async function buscarNegocioPorSlugId(id: string) {
  return db.query.negocio.findFirst({
    where: (n, { eq }) => eq(n.id, id),
    with: {
      contatos: true,
      localizacao: true,
      horarios: true,
      categorias: true,
    },
  });
}
