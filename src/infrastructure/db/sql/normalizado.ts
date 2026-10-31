import { sql, type SQL } from "drizzle-orm";

/**
 * Compara texto sem acento e sem caixa SEM depender da extensão `unaccent`.
 *
 * `unaccent()` não está instalada no Postgres do projeto (nem no local, nem no
 * Neon). As consultas de duplicata usavam `lower(unaccent(coluna))` e
 * estouravam com `function unaccent(text) does not exist` — o formulário de
 * correção respondia 500 em qualquer envio. `translate()` é função nativa e faz
 * o mesmo trabalho para o alfabeto que o guia usa.
 */
const ACENTOS = "áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ";
const SEM_ACENTO = "aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN";

export function colunaNormalizada(coluna: SQL | unknown): SQL {
  return sql`translate(lower(${coluna}), ${ACENTOS}, ${SEM_ACENTO})`;
}

/** Normaliza um termo em JS do mesmo jeito que a coluna é normalizada no SQL. */
export function termoNormalizado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
