// src/scripts/publicar-documentos-legais.ts
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { documentoTermo } from "@/infrastructure/db/schema";
import {
  DOCUMENTOS_LEGAIS,
  VERSAO_DOCUMENTOS_LEGAIS,
} from "./documentos-legais";

type AcaoPublicacao = "criado" | "atualizado";

interface ResultadoDocumento {
  tipo: string;
  titulo: string;
  versao: string;
  acao: AcaoPublicacao;
  anterioresDesativadas: number;
}

/**
 * Publica os documentos legais em uma única transação.
 *
 * O alvo lógico é o par (tipo, versao), mas `documento_termo` não tem
 * constraint única para esse par. Por isso o upsert é feito em duas etapas
 * dentro da transação (select + update/insert), e não com ON CONFLICT: um
 * `onConflictDoUpdate` apontando para um par sem índice único falharia no
 * PostgreSQL com "no unique or exclusion constraint matching the ON CONFLICT
 * specification".
 *
 * A rotina é idempotente: rodar novamente atualiza a mesma versão, reativa o
 * registro e não deixa nenhuma versão anterior vigente no mesmo tipo.
 */
async function publicarDocumentos(): Promise<ResultadoDocumento[]> {
  const publicadoEm = new Date();

  return db.transaction(async (tx) => {
    const resultados: ResultadoDocumento[] = [];

    for (const documento of DOCUMENTOS_LEGAIS) {
      // 1. Desativa versões anteriores do mesmo tipo (nunca a versão alvo).
      const anteriores = await tx
        .update(documentoTermo)
        .set({ vigente: false })
        .where(
          and(
            eq(documentoTermo.tipo, documento.tipo),
            eq(documentoTermo.vigente, true),
            ne(documentoTermo.versao, documento.versao),
          ),
        )
        .returning({ id: documentoTermo.id });

      // 2. Upsert lógico por (tipo, versao).
      const [existente] = await tx
        .select({ id: documentoTermo.id })
        .from(documentoTermo)
        .where(
          and(
            eq(documentoTermo.tipo, documento.tipo),
            eq(documentoTermo.versao, documento.versao),
          ),
        )
        .limit(1);

      if (existente) {
        await tx
          .update(documentoTermo)
          .set({
            conteudo: documento.conteudo,
            vigente: true,
            publicadoEm,
          })
          .where(eq(documentoTermo.id, existente.id));

        resultados.push({
          tipo: documento.tipo,
          titulo: documento.titulo,
          versao: documento.versao,
          acao: "atualizado",
          anterioresDesativadas: anteriores.length,
        });
        continue;
      }

      await tx.insert(documentoTermo).values({
        tipo: documento.tipo,
        versao: documento.versao,
        conteudo: documento.conteudo,
        vigente: true,
        publicadoEm,
      });

      resultados.push({
        tipo: documento.tipo,
        titulo: documento.titulo,
        versao: documento.versao,
        acao: "criado",
        anterioresDesativadas: anteriores.length,
      });
    }

    return resultados;
  });
}

/** Mostra apenas o host do banco, sem credenciais, para evitar acidente. */
function descreverBanco(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "DATABASE_URL não definida";
  try {
    return new URL(url).host;
  } catch {
    return "DATABASE_URL em formato inválido";
  }
}

async function main(): Promise<void> {
  console.log("📚 Publicando documentos legais do GuiaBG");
  console.log(`   Versão: ${VERSAO_DOCUMENTOS_LEGAIS}`);
  console.log(`   Banco: ${descreverBanco()}`);
  console.log("");

  const resultados = await publicarDocumentos();

  let criados = 0;
  let atualizados = 0;
  let anterioresDesativadas = 0;

  for (const resultado of resultados) {
    const icone = resultado.acao === "criado" ? "✅" : "🔄";
    console.log(
      `${icone} ${resultado.titulo} (${resultado.tipo}) v${resultado.versao}: ` +
        `${resultado.acao}; ${resultado.anterioresDesativadas} versão(ões) anterior(es) desativada(s)`,
    );

    if (resultado.acao === "criado") {
      criados += 1;
    } else {
      atualizados += 1;
    }
    anterioresDesativadas += resultado.anterioresDesativadas;
  }

  console.log("");
  console.log(
    `📊 Resumo: ${resultados.length} documentos vigentes — ` +
      `${criados} criado(s), ${atualizados} atualizado(s), ` +
      `${anterioresDesativadas} versão(ões) anterior(es) desativada(s).`,
  );
  console.log(
    `   Versão publicada: ${VERSAO_DOCUMENTOS_LEGAIS} em ${new Date().toISOString()}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((erro: unknown) => {
    console.error("❌ Falha ao publicar documentos legais:", erro);
    process.exit(1);
  });
