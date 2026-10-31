// src/application/termos/publicos.ts
import { desc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { documentoTermo } from "@/infrastructure/db/schema/documento-termo";

/**
 * Documentos legais vigentes (RF-071). Leitura pública: a página /termos e
 * /privacidade precisa mostrar o texto que o solicitante aceitou, na versão
 * publicada — não um texto fixo no código.
 */
export type TipoTermo =
  "termos_uso" | "politica_privacidade" | "tratamento_dados";

export async function listarTermosVigentes(tipos: TipoTermo[]) {
  const linhas = await db
    .select({
      id: documentoTermo.id,
      tipo: documentoTermo.tipo,
      versao: documentoTermo.versao,
      conteudo: documentoTermo.conteudo,
      publicadoEm: documentoTermo.publicadoEm,
    })
    .from(documentoTermo)
    .where(eq(documentoTermo.vigente, true))
    .orderBy(desc(documentoTermo.publicadoEm));

  return linhas.filter((linha) => tipos.includes(linha.tipo as TipoTermo));
}
