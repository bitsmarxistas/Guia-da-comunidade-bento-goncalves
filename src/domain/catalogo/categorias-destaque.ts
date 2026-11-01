// src/domain/catalogo/categorias-destaque.ts

/**
 * Separa as categorias em "principais" (mostradas) e "restantes" (atrás do
 * botão "ver todas").
 *
 * Regra de produto: principal = categoria que tem comércio publicado,
 * ordenada por quantidade. Enquanto o guia está vazio (ou tem pouca coisa),
 * completa com uma lista curada das categorias que mais importam numa cidade.
 * A marcação manual `oculta` continua valendo como override: categoria
 * escondida pela administração nunca aparece no primeiro bloco.
 */

export interface CategoriaComTotal {
  id: string;
  nome: string;
  slug: string;
  oculta: boolean;
  /** Comércios publicados nesta categoria. */
  total: number;
}

/** Quantas categorias aparecem antes do botão. */
export const LIMITE_PRINCIPAIS = 15;

/**
 * Categorias de base do guia, na ordem em que fazem sentido para o visitante.
 * Usadas só para completar quando ainda não há comércio publicado suficiente.
 */
export const CATEGORIAS_BASE: string[] = [
  "padarias-e-confeitarias",
  "restaurantes",
  "hamburguerias-e-lanchonetes",
  "pizzarias",
  "cafeterias",
  "supermercados-e-mercados",
  "saloes-de-beleza",
  "clinicas-medicas",
  "dentistas-e-odontologia",
  "academias-e-esportes",
  "automotivo",
  "casa-e-construcao",
  "moda-roupas-e-calcados",
  "advogados",
  "pet-shop",
];

export function dividirCategorias(
  categorias: CategoriaComTotal[],
  limite = LIMITE_PRINCIPAIS,
): { principais: CategoriaComTotal[]; restantes: CategoriaComTotal[] } {
  const ordenadas = [...categorias].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const comComercio = ordenadas.filter((c) => c.total > 0 && !c.oculta);
  const principais: CategoriaComTotal[] = comComercio.slice(0, limite);
  const jaIncluidas = new Set(principais.map((c) => c.slug));

  if (principais.length < limite) {
    for (const slug of CATEGORIAS_BASE) {
      if (principais.length >= limite) break;
      if (jaIncluidas.has(slug)) continue;
      const achada = ordenadas.find((c) => c.slug === slug && !c.oculta);
      if (!achada) continue;
      principais.push(achada);
      jaIncluidas.add(slug);
    }
  }

  // O que sobrou vai para o bloco recolhido — inclusive as marcadas ocultas.
  const restantes = ordenadas.filter((c) => !jaIncluidas.has(c.slug));

  return { principais, restantes };
}
