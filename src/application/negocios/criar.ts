// src/application/negocios/criar.ts
"use server";

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import {
  negocio,
  contato,
  localizacao,
  horarioFuncionamento,
  negocioCategoria,
} from "@/infrastructure/db/schema";
import { eq, sql } from "drizzle-orm";
import { colunaNormalizada } from "@/infrastructure/db/sql/normalizado";
import { gerarSlugUnico } from "@/domain/utils/gerar-slug-unico";
import { normalizarSlug } from "@/domain/utils/normalizar-slug";
import { logNegocio } from "@/infrastructure/db/schema/logs";

const criarNegocioSchema = z.object({
  nome: z.string().min(1).max(150),
  descricao: z.string().min(1),
  contatos: z
    .array(
      z.object({
        tipo: z.enum([
          "whatsapp",
          "telefone",
          "instagram",
          "email",
          "site",
          "outro",
        ]),
        valor: z.string().min(1),
        ordem: z.number().default(0),
        valido: z.boolean().default(true),
      }),
    )
    .min(1),
  localizacao: z
    .object({
      endereco: z.string().max(200).optional(),
      bairro: z.string().max(80).optional(),
      areaAtendimento: z.string().max(200).optional(),
      // Endereço estruturado: os mesmos campos do formulário público.
      cep: z.string().max(9).optional(),
      numero: z.string().max(20).optional(),
      semPontoComercial: z.boolean().optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
    })
    .optional(),
  horarios: z
    .array(
      z.object({
        diaSemana: z.number().min(0).max(6),
        horaAbertura: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        horaFechamento: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        observacao: z.string().max(100).optional(),
      }),
    )
    .optional(),
  categoriasIds: z.array(z.string().uuid()).min(1),
});

export async function criarNegocioAction(
  prevState: unknown,
  formData: FormData,
) {
  /*
   * Listas chegam como UM campo com JSON (é assim que o formulário do painel
   * monta). O código antigo usava `getAll`, que devolvia `[[...]]` e fazia o
   * Zod recusar tudo: "Criar comércio" nunca salvava. Aceita os dois formatos
   * para não quebrar chamadas antigas que mandassem um item por campo.
   */
  const listaDoCampo = (nome: string): unknown[] => {
    const bruto = formData.get(nome);
    if (typeof bruto === "string" && bruto.trim() !== "") {
      const analisado = JSON.parse(bruto);
      return Array.isArray(analisado) ? analisado : [analisado];
    }
    return formData
      .getAll(nome)
      .map((item) => JSON.parse(item as string))
      .flatMap((item) => (Array.isArray(item) ? item : [item]));
  };

  const contatos = listaDoCampo("contatos");
  const horarios = listaDoCampo("horarios");

  const localizacaoRaw = formData.get("localizacao");
  // Nome diferente do import `localizacao`: a variável sombreava a tabela e o
  // insert explodia com "Cannot read properties of undefined".
  const localizacaoDados = localizacaoRaw
    ? JSON.parse(localizacaoRaw as string)
    : undefined;

  const categoriasIdsRaw = formData.getAll("categoriasIds");
  const categoriasIds = categoriasIdsRaw.map((id) => id as string);

  const rawData = {
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    contatos,
    localizacao: localizacaoDados,
    horarios,
    categoriasIds,
  };

  const parseResult = criarNegocioSchema.safeParse(rawData);
  if (!parseResult.success) {
    const errorMsg = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { error: "Dados inválidos: " + (errorMsg || "Dados inválidos") };
  }

  const {
    nome,
    descricao,
    contatos: contatosValidos,
    localizacao: loc,
    horarios: hrs,
    categoriasIds: catIds,
  } = parseResult.data;

  // Detectar duplicata por nome normalizado
  const baseSlug = normalizarSlug(nome);
  const slugsExistentes = new Set(
    (await db.query.negocio.findMany({ columns: { slug: true } })).map(
      (n) => n.slug,
    ),
  );
  const slug = gerarSlugUnico(baseSlug, slugsExistentes);

  // Verificar duplicata de nome (normalizado)
  const nomeNormalizado = nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const existente = await db.query.negocio.findFirst({
    where: (n, { eq, sql }) =>
      sql`${colunaNormalizada(n.nome)} = ${nomeNormalizado}`,
  });

  if (existente) {
    // Alerta mas não bloqueia (nível B)
    console.warn(
      `Possível duplicata detectada: ${existente.nome} (ID: ${existente.id})`,
    );
  }

  // Criar negócio em transação
  const resultado = await db.transaction(async (tx) => {
    const insertResult = await tx
      .insert(negocio)
      .values({
        slug,
        nome: nome.trim(),
        descricao: descricao.trim(),
        situacaoPublicacao: "nao_elegivel",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      })
      .returning();

    const novoNegocio = insertResult[0];
    if (!novoNegocio) throw new Error("Falha ao criar negócio");

    // Inserir contatos
    if (contatosValidos.length > 0) {
      await tx.insert(contato).values(
        contatosValidos.map((c, i) => ({
          negocioId: novoNegocio.id,
          tipo: c.tipo,
          valor: c.valor,
          ordem: c.ordem ?? i,
          valido: c.valido ?? true,
        })),
      );
    }

    // Inserir localização se fornecida (inclusive CEP/número/coordenadas)
    if (
      loc &&
      (loc.endereco ||
        loc.bairro ||
        loc.areaAtendimento ||
        loc.cep ||
        loc.numero)
    ) {
      await tx.insert(localizacao).values({
        negocioId: novoNegocio.id,
        endereco: loc.endereco?.trim() || null,
        bairro: loc.bairro?.trim() || null,
        areaAtendimento: loc.areaAtendimento?.trim() || null,
        cep: loc.cep?.replace(/\D/g, "") || null,
        numero: loc.numero?.trim() || null,
        semPontoComercial: Boolean(loc.semPontoComercial),
        latitude: typeof loc.latitude === "number" ? loc.latitude : null,
        longitude: typeof loc.longitude === "number" ? loc.longitude : null,
        geocodificadoEm: typeof loc.latitude === "number" ? new Date() : null,
      });
    }

    // Inserir horários se fornecidos
    if (hrs && hrs.length > 0) {
      await tx.insert(horarioFuncionamento).values(
        hrs.map((h) => ({
          negocioId: novoNegocio.id,
          diaSemana: h.diaSemana,
          horaAbertura: h.horaAbertura,
          horaFechamento: h.horaFechamento,
          observacao: h.observacao?.trim() || null,
        })),
      );
    }

    // Associar categorias
    if (catIds.length > 0) {
      await tx.insert(negocioCategoria).values(
        catIds.map((catId) => ({
          negocioId: novoNegocio.id,
          categoriaId: catId,
        })),
      );
    }

    // Log de auditoria
    await tx.insert(logNegocio).values({
      atorTipo: "admin",
      negocioId: novoNegocio.id,
      acao: "criar",
      snapshotDepois: JSON.stringify(novoNegocio),
    });

    return novoNegocio;
  });

  return { success: true, negocio: resultado };
}
