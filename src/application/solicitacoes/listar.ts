// src/application/solicitacoes/listar.ts
"use server";

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { solicitacao, solicitante } from "@/infrastructure/db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { SITUACOES_SOLICITACAO } from "@/domain/solicitacoes/situacao";
import { protocoloDaSolicitacao } from "@/domain/solicitacoes/protocolo";

const situacoesValidas = SITUACOES_SOLICITACAO as unknown as [
  string,
  ...string[],
];

const listarSolicitacoesSchema = z.object({
  situacao: z.enum(situacoesValidas).optional(),
  tipo: z.enum(["inclusao", "atualizacao"]).optional(),
  busca: z.string().trim().max(120).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listarSolicitacoesAction(
  prevState: unknown,
  formData: FormData,
) {
  const rawData = {
    situacao: (formData.get("situacao") as string) || undefined,
    tipo: (formData.get("tipo") as string) || undefined,
    busca: (formData.get("busca") as string) || undefined,
    pagina: formData.get("pagina") ? Number(formData.get("pagina")) : 1,
    porPagina: formData.get("porPagina")
      ? Number(formData.get("porPagina"))
      : 20,
  };

  const parseResult = listarSolicitacoesSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      error: "Parâmetros inválidos",
      solicitacoes: [],
      total: 0,
      pagina: 1,
      porPagina: 20,
      totalPaginas: 0,
    };
  }

  const { situacao, tipo, busca, pagina, porPagina } = parseResult.data;

  const condicoes = [];
  if (situacao) condicoes.push(eq(solicitacao.situacao, situacao));
  if (tipo) condicoes.push(eq(solicitacao.tipo, tipo));
  if (busca) {
    const termo = `%${busca}%`;
    condicoes.push(
      or(
        sql`${solicitacao.dadosNegocioProposto}->>'nome' ILIKE ${termo}`,
        sql`${solicitante.nome} ILIKE ${termo}`,
        sql`${solicitante.email} ILIKE ${termo}`,
        // Protocolo: o admin cola o código do e-mail (ex.: "A1B2C3D4").
        sql`replace(${solicitacao.id}::text, '-', '') ILIKE ${termo}`,
      ),
    );
  }

  const whereClause = condicoes.length > 0 ? and(...condicoes) : undefined;

  const [linhas, totalResult] = await Promise.all([
    db
      .select({
        id: solicitacao.id,
        situacao: solicitacao.situacao,
        tipo: solicitacao.tipo,
        criadoEm: solicitacao.criadoEm,
        analisadaEm: solicitacao.analisadaEm,
        negocioId: solicitacao.negocioId,
        motivoIncompleta: solicitacao.motivoIncompleta,
        duplicataDetectada: solicitacao.duplicataDetectada,
        nomeNegocio: sql<
          string | null
        >`${solicitacao.dadosNegocioProposto}->>'nome'`,
        bairro: sql<
          string | null
        >`${solicitacao.dadosNegocioProposto}->'localizacao'->>'bairro'`,
        nomeSolicitante: solicitante.nome,
        emailSolicitante: solicitante.email,
      })
      .from(solicitacao)
      .innerJoin(solicitante, eq(solicitante.id, solicitacao.solicitanteId))
      .where(whereClause)
      .orderBy(desc(solicitacao.criadoEm))
      // Paginação de verdade: antes limit/offset eram fixos (20/0) e a tela
      // mostrava sempre a primeira página.
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    // O total precisa respeitar o filtro de busca, que depende do join.
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(solicitacao)
      .innerJoin(solicitante, eq(solicitante.id, solicitacao.solicitanteId))
      .where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  return {
    solicitacoes: linhas.map((linha) => ({
      ...linha,
      protocolo: protocoloDaSolicitacao(linha.id),
    })),
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function buscarSolicitacaoPorIdAction(
  prevState: unknown,
  formData: FormData,
) {
  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID é obrigatório" };
  }

  const sol = await db.query.solicitacao.findFirst({
    where: (s, { eq }) => eq(s.id, id),
    with: {
      solicitante: true,
      categoriasSugeridas: true,
      // Nome do comércio já publicado (chamado de correção): a tela mostra a
      // ficha real, não só o snapshot do pedido.
      negocio: { columns: { nome: true, slug: true } },
    },
  });

  if (!sol) {
    return { error: "Solicitação não encontrada" };
  }

  return { solicitacao: { ...sol, protocolo: protocoloDaSolicitacao(sol.id) } };
}
