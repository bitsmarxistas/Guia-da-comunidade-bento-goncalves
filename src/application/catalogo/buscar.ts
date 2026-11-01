// src/application/catalogo/buscar.ts
"use server";

import { db } from "@/infrastructure/db/client";
import {
  negocio,
  categoria,
  contato,
  localizacao,
  horarioFuncionamento,
  negocioCategoria,
  imagem,
} from "@/infrastructure/db/schema";
import { eq, and, or, desc, asc, sql, inArray, exists } from "drizzle-orm";
import { normalizarTexto } from "@/domain/utils/normalizar-texto";
import { calcularAbertoAgora } from "@/domain/utils/calcular-aberto-agora";

interface BuscarParams {
  q?: string;
  categoriasIds?: string[];
  bairros?: string[];
  pagina?: number;
  porPagina?: number;
  ordenacao?: "relevancia" | "nome_asc" | "nome_desc" | "atualizado_desc";
  /** Só comércios abertos neste momento (America/Sao_Paulo). */
  abertoAgora?: boolean;
}

interface NegocioCompleto {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  situacaoPublicacao: string;
  categorias: Array<{ id: string; nome: string; slug: string }>;
  contatos: Array<{ tipo: string; valor: string; ordem: number }>;
  localizacao: { bairro: string | null; areaAtendimento: string | null } | null;
  horarios: Array<{
    diaSemana: number;
    horaAbertura: string;
    horaFechamento: string;
  }>;
  abertoAgora: "aberto" | "fechado" | "sem_horario";
  /** Imagens aprovadas pela moderação (logo primeiro, depois fotos). */
  imagens: Array<{ id: string; url: string; tipo: string }>;
}

export async function buscarNegocios(
  params: {
    q?: string;
    categoriasIds?: string[];
    bairros?: string[];
    pagina?: number;
    porPagina?: number;
    ordenacao?: "relevancia" | "nome_asc" | "nome_desc" | "atualizado_desc";
    abertoAgora?: boolean;
  } = {},
): Promise<{
  negocios: NegocioCompleto[];
  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
}> {
  const {
    q,
    categoriasIds,
    bairros,
    pagina = 1,
    porPagina = 20,
    ordenacao = "relevancia",
  } = params;

  const termoNormalizado = params.q
    ? params.q
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : "";

  // Build all conditions
  const conditions: any[] = [eq(negocio.situacaoPublicacao, "publicado")];

  if (termoNormalizado) {
    // Busca sem sensibilidade a acento/caixa: "pao" encontra "Pão", "ze" encontra "Zé".
    // O LIKE é aplicado sobre a coluna normalizada, então os acentos do termo
    // (já removidos acima) casam com os acentos removidos da coluna.
    const termoLike = `%${termoNormalizado}%`;
    const ACENTOS = "áàâãäéèêëíìîïóòôõöúùûüçñ";
    const SEM_ACENTO = "aaaaaeeeeiiiiooooouuuucn";
    const colunaNormalizada = (coluna: unknown) =>
      sql`translate(lower(${coluna}), ${ACENTOS}, ${SEM_ACENTO})`;

    conditions.push(
      or(
        sql`${colunaNormalizada(negocio.nome)} LIKE ${termoLike}`,
        sql`${colunaNormalizada(negocio.descricao)} LIKE ${termoLike}`,
        sql`EXISTS (
          SELECT 1
          FROM ${negocioCategoria} nc
          JOIN ${categoria} c ON c.id = nc.categoria_id
          WHERE nc.negocio_id = ${negocio.id}
            AND translate(lower(c.nome), ${ACENTOS}, ${SEM_ACENTO}) LIKE ${termoLike}
        )`,
      ),
    );
  }

  if (params.categoriasIds && params.categoriasIds.length > 0) {
    conditions.push(
      exists(
        db
          .select({ negocioId: negocioCategoria.negocioId })
          .from(negocioCategoria)
          .where(
            and(
              eq(negocioCategoria.negocioId, negocio.id),
              inArray(negocioCategoria.categoriaId, params.categoriasIds),
            ),
          ),
      ),
    );
  }

  if (params.bairros && params.bairros.length > 0) {
    conditions.push(
      exists(
        db
          .select({ negocioId: localizacao.negocioId })
          .from(localizacao)
          .where(
            and(
              eq(localizacao.negocioId, negocio.id),
              inArray(localizacao.bairro, params.bairros),
            ),
          ),
      ),
    );
  }

  /*
   * "Aberto agora" no BANCO, não depois.
   *
   * O filtro do catálogo precisa reduzir o resultado (e o total da paginação),
   * então o horário tem que entrar no WHERE. O fuso é fixo em
   * America/Sao_Paulo — o guia é de Bento Gonçalves e o servidor da Vercel roda
   * em UTC, o que deslocaria o dia da semana em 3 horas.
   */
  if (params.abertoAgora) {
    const agoraLocal = sql`(now() AT TIME ZONE 'America/Sao_Paulo')`;
    const horaLocal = sql`to_char(${agoraLocal}, 'HH24:MI')::time`;

    conditions.push(
      sql`EXISTS (
        SELECT 1
        FROM ${horarioFuncionamento} hf
        WHERE hf.negocio_id = ${negocio.id}
          AND hf.dia_semana = EXTRACT(DOW FROM ${agoraLocal})
          AND (
            CASE
              WHEN hf.hora_abertura <= hf.hora_fechamento
                THEN ${horaLocal} >= hf.hora_abertura AND ${horaLocal} < hf.hora_fechamento
              ELSE ${horaLocal} >= hf.hora_abertura OR ${horaLocal} < hf.hora_fechamento
            END
          )
      )`,
    );
  }

  // Build orderBy
  const orderByMap = {
    relevancia: desc(negocio.atualizadoEm),
    nome_asc: asc(negocio.nome),
    nome_desc: desc(negocio.nome),
    atualizado_desc: desc(negocio.atualizadoEm),
  };
  const orderBy = orderByMap[params.ordenacao || "relevancia"];

  // Execute query with all conditions at once
  const query = db
    .select({
      id: negocio.id,
      slug: negocio.slug,
      nome: negocio.nome,
      descricao: negocio.descricao,
      situacaoPublicacao: negocio.situacaoPublicacao,
      atualizadoEm: negocio.atualizadoEm,
    })
    .from(negocio)
    .where(and(...conditions))
    .orderBy(orderByMap[params.ordenacao || "relevancia"]);

  // O total precisa respeitar os mesmos filtros da listagem (RF-005 / F4-07):
  // antes contava todos os publicados e a paginação ficava incorreta ao filtrar.
  const totalResult = await db.$count(negocio, and(...conditions));
  const negociosBase = await query
    .limit(params.porPagina || 20)
    .offset(((params.pagina || 1) - 1) * (params.porPagina || 20));

  if (negociosBase.length === 0) {
    return {
      negocios: [],
      paginacao: {
        pagina: params.pagina || 1,
        porPagina: params.porPagina || 20,
        total: 0,
        totalPaginas: 0,
      },
    };
  }

  const negociosIds = negociosBase.map((n) => n.id);

  const [contatosArr, localizacoesArr, horariosArr, categoriasRel, imagensArr] =
    await Promise.all([
      db
        .select()
        .from(contato)
        .where(
          and(
            eq(contato.valido, true),
            inArray(contato.negocioId, negociosIds),
          ),
        ),
      db
        .select()
        .from(localizacao)
        .where(inArray(localizacao.negocioId, negociosIds)),
      db
        .select()
        .from(horarioFuncionamento)
        .where(inArray(horarioFuncionamento.negocioId, negociosIds)),
      db
        .select({
          negocioId: negocioCategoria.negocioId,
          categoria: {
            id: categoria.id,
            nome: categoria.nome,
            slug: categoria.slug,
          },
        })
        .from(negocioCategoria)
        .innerJoin(categoria, eq(negocioCategoria.categoriaId, categoria.id))
        .where(
          and(
            eq(categoria.ativa, true),
            inArray(negocioCategoria.negocioId, negociosIds),
          ),
        ),
      // Só imagem aprovada pela moderação aparece no site.
      db
        .select({
          id: imagem.id,
          negocioId: imagem.negocioId,
          url: imagem.url,
          tipo: imagem.tipo,
        })
        .from(imagem)
        .where(
          and(
            eq(imagem.situacao, "aprovada"),
            inArray(imagem.negocioId, negociosIds),
          ),
        )
        .orderBy(asc(imagem.criadoEm)),
    ]);

  // Group related data by negocioId
  const contatosByNegocio = new Map<
    string,
    Array<{ tipo: string; valor: string; ordem: number }>
  >();
  for (const c of contatosArr) {
    if (!contatosByNegocio.has(c.negocioId))
      contatosByNegocio.set(c.negocioId, []);
    contatosByNegocio
      .get(c.negocioId)!
      .push({ tipo: c.tipo, valor: c.valor, ordem: c.ordem });
  }

  const localizacoesByNegocio = new Map<
    string,
    { bairro: string | null; areaAtendimento: string | null }
  >();
  for (const l of localizacoesArr) {
    localizacoesByNegocio.set(l.negocioId, {
      bairro: l.bairro,
      areaAtendimento: l.areaAtendimento,
    });
  }

  const horariosByNegocio = new Map<
    string,
    Array<{ diaSemana: number; horaAbertura: string; horaFechamento: string }>
  >();
  for (const h of horariosArr) {
    if (!horariosByNegocio.has(h.negocioId))
      horariosByNegocio.set(h.negocioId, []);
    horariosByNegocio.get(h.negocioId)!.push({
      diaSemana: h.diaSemana,
      horaAbertura: h.horaAbertura,
      horaFechamento: h.horaFechamento,
    });
  }

  const categoriasByNegocio = new Map<
    string,
    Array<{ id: string; nome: string; slug: string }>
  >();
  for (const c of categoriasRel) {
    if (!categoriasByNegocio.has(c.negocioId))
      categoriasByNegocio.set(c.negocioId, []);
    categoriasByNegocio.get(c.negocioId)!.push({
      id: c.categoria.id,
      nome: c.categoria.nome,
      slug: c.categoria.slug,
    });
  }

  const imagensByNegocio = new Map<
    string,
    Array<{ id: string; url: string; tipo: string }>
  >();
  for (const img of imagensArr) {
    // Imagem de solicitação ainda sem comércio não entra em card nenhum.
    if (!img.negocioId) continue;
    if (!imagensByNegocio.has(img.negocioId))
      imagensByNegocio.set(img.negocioId, []);
    imagensByNegocio
      .get(img.negocioId)!
      .push({ id: img.id, url: img.url, tipo: img.tipo });
  }

  const negocios: NegocioCompleto[] = negociosBase.map((n) => {
    const horariosN = horariosArr
      .filter((h) => h.negocioId === n.id)
      .map((h) => ({
        diaSemana: h.diaSemana,
        horaAbertura: h.horaAbertura,
        horaFechamento: h.horaFechamento,
      }));
    const abertoAgora: "aberto" | "fechado" | "sem_horario" =
      horariosN.length > 0
        ? calcularAbertoAgora(horariosN, new Date())
        : "sem_horario";

    return {
      id: n.id,
      slug: n.slug,
      nome: n.nome,
      descricao: n.descricao,
      situacaoPublicacao: n.situacaoPublicacao,
      categorias: categoriasByNegocio.get(n.id) || [],
      contatos: (contatosByNegocio.get(n.id) || []).sort(
        (a, b) => a.ordem - b.ordem,
      ),
      localizacao: localizacoesByNegocio.get(n.id) || null,
      horarios: horariosN,
      abertoAgora,
      imagens: imagensByNegocio.get(n.id) ?? [],
    };
  });

  return {
    negocios,
    paginacao: {
      pagina: params.pagina || 1,
      porPagina: params.porPagina || 20,
      total: totalResult,
      totalPaginas: Math.ceil(totalResult / (params.porPagina || 20)),
    },
  };
}

/**
 * Categorias ativas do guia.
 *
 * `incluirOcultas = false` (padrão) devolve só as **principais**, usadas na home
 * e nos atalhos. O catálogo e os filtros chamam com `true`, porque lá a
 * categoria oculta continua existindo para o visitante.
 */
export async function listarCategoriasAtivas(
  opcoes: { incluirOcultas?: boolean } = {},
) {
  const incluirOcultas = opcoes.incluirOcultas ?? false;

  /*
   * `total` = comércios publicados na categoria. A home usa esse número para
   * escolher quais são as "principais": antes a divisão era só pela marcação
   * manual de oculta, e como nenhuma estava marcada o site mostrava as 100
   * categorias de uma vez.
   */
  return db
    .select({
      id: categoria.id,
      nome: categoria.nome,
      slug: categoria.slug,
      ativa: categoria.ativa,
      oculta: categoria.oculta,
      total: sql<number>`(
        select count(*)::int
        from ${negocioCategoria} nc
        join ${negocio} n on n.id = nc.negocio_id
        where nc.categoria_id = ${categoria.id} and n.situacao_publicacao = 'publicado'
      )`,
    })
    .from(categoria)
    .where(
      incluirOcultas
        ? eq(categoria.ativa, true)
        : and(eq(categoria.ativa, true), eq(categoria.oculta, false)),
    )
    .orderBy(asc(categoria.nome));
}

export interface BairroComTotal {
  bairro: string;
  total: number;
}

/**
 * Bairros com ao menos um negócio publicado, com contagem por bairro.
 * Alimenta o filtro de bairro do catálogo (RF-004 / F4-06).
 */
export async function listarBairrosComNegocios(): Promise<BairroComTotal[]> {
  const result = await db
    .select({
      bairro: localizacao.bairro,
      total: sql<number>`count(*)::int`,
    })
    .from(localizacao)
    .innerJoin(negocio, eq(negocio.id, localizacao.negocioId))
    .where(
      and(
        eq(negocio.situacaoPublicacao, "publicado"),
        sql`${localizacao.bairro} IS NOT NULL`,
      ),
    )
    .groupBy(localizacao.bairro)
    .orderBy(asc(localizacao.bairro));

  return result
    .filter((r): r is { bairro: string; total: number } => r.bairro !== null)
    .map((r) => ({ bairro: r.bairro, total: Number(r.total) }));
}

export interface NegocioSitemap {
  slug: string;
  atualizadoEm: Date;
}

/**
 * Negócios publicados, no formato mínimo para o sitemap (RF-066 / F4-12).
 */
export async function listarNegociosPublicadosParaSitemap(): Promise<
  NegocioSitemap[]
> {
  return db
    .select({ slug: negocio.slug, atualizadoEm: negocio.atualizadoEm })
    .from(negocio)
    .where(eq(negocio.situacaoPublicacao, "publicado"))
    .orderBy(desc(negocio.atualizadoEm));
}
