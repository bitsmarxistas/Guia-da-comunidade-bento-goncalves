// src/application/solicitacoes/atualizar.ts
"use server";

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import {
  solicitante,
  solicitacao,
  sugestaoCategoria,
  aceiteTermo,
  documentoTermo,
  negocio,
  contato,
  categoria,
} from "@/infrastructure/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { normalizarTexto } from "@/domain/utils/normalizar-texto";
import { appendLog } from "@/infrastructure/audit/audit.service";
import { contextoDaRequisicao } from "@/lib/audit-context";
import {
  calcularAlteracoes,
  type AlteracaoCampo,
} from "@/domain/solicitacoes/alteracoes";
import { protocoloDaSolicitacao } from "@/domain/solicitacoes/protocolo";
import { notificarSolicitacaoRecebida } from "@/infrastructure/email/participacao";
import { colunaNormalizada } from "@/infrastructure/db/sql/normalizado";
import {
  logSolicitacaoRecebida,
  logVinculacaoSolicitacao,
} from "@/infrastructure/db/schema/logs";

/** Nomes das categorias escolhidas — o diff fala em nome, não em UUID. */
async function nomesDasCategorias(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const linhas = await db
    .select({ nome: categoria.nome })
    .from(categoria)
    .where(inArray(categoria.id, ids));
  return linhas.map((linha) => linha.nome);
}

const TelefoneOpcional = z
  .string()
  .optional()
  .transform((valor) => (valor ?? "").replace(/\D/g, ""))
  .refine(
    (digitos) =>
      digitos.length === 0 || (digitos.length >= 10 && digitos.length <= 11),
    {
      message:
        "Telefone deve ter DDD + número (10 ou 11 dígitos), ou ficar em branco.",
    },
  );

const atualizarSolicitacaoSchema = z.object({
  // Dados do solicitante
  nomeSolicitante: z.string().min(1, "Informe seu nome.").max(120),
  email: z.string().email("Informe um e-mail válido."),
  telefone: TelefoneOpcional,
  // Dados do negócio
  nomeNegocio: z.string().min(1, "Informe o nome do comércio.").max(150),
  descricao: z.string().min(1, "Descreva o comércio."),
  /*
   * Contatos são OPCIONAIS no chamado de correção: o formulário só mostra o
   * WhatsApp atual como referência. Quando não vêm, a aprovação preserva os
   * contatos publicados (antes ela apagava telefone, e-mail e Instagram e
   * deixava só o WhatsApp).
   */
  contatos: z
    .array(
      z.object({
        tipo: z.enum(["whatsapp", "telefone", "instagram", "email", "outro"]),
        valor: z.string().min(1, "Contato vazio."),
        ordem: z.number().default(0),
      }),
    )
    .min(1, "Informe ao menos um contato do comércio.")
    .optional(),
  categoriasIds: z.array(z.string().uuid()).optional(),
  sugestaoCategoria: z.string().max(150).optional(),
  localizacao: z
    .object({
      endereco: z.string().max(200).optional(),
      bairro: z.string().max(80).optional(),
      areaAtendimento: z.string().max(200).optional(),
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
  // Comércio que está sendo corrigido (obrigatório no fluxo de correção).
  negocioId: z.string().uuid().optional(),
  // Declaração e aceite
  declaracaoVinculo: z.string().min(1, "Declare seu vínculo com o comércio."),
  aceiteTermos: z
    .boolean()
    .refine((v) => v === true, "É obrigatório aceitar os termos"),
});

/**
 * Corrige a ficha de um comércio já publicado.
 *
 * Diferença central para `criarSolicitacaoAction`: aqui o pedido aponta para um
 * comércio existente (`negocioId`) e, ao ser aprovado, ATUALIZA a ficha — não
 * cria um segundo cadastro. Correção nunca vira inclusão.
 */
export async function criarSolicitacaoAtualizacaoAction(
  prevState: unknown,
  formData: FormData,
) {
  const rawData = {
    nomeSolicitante: formData.get("nomeSolicitante"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    nomeNegocio: formData.get("nomeNegocio"),
    descricao: formData.get("descricao"),
    // Ausente = "não mexe nos contatos" (o formulário de correção não os envia).
    contatos: formData.get("contatos")
      ? JSON.parse(formData.get("contatos") as string)
      : undefined,
    categoriasIds:
      formData.getAll("categoriasIds").length > 0
        ? formData.getAll("categoriasIds").map((id) => id as string)
        : undefined,
    sugestaoCategoria: formData.get("sugestaoCategoria") || undefined,
    localizacao: formData.get("localizacao")
      ? JSON.parse(formData.get("localizacao") as string)
      : undefined,
    horarios: formData.get("horarios")
      ? JSON.parse(formData.get("horarios") as string)
      : undefined,
    declaracaoVinculo: formData.get("declaracaoVinculo"),
    aceiteTermos: formData.get("aceiteTermos") === "true",
    negocioId: formData.get("negocioId") || undefined,
  };

  const parseResult = atualizarSolicitacaoSchema.safeParse(rawData);
  if (!parseResult.success) {
    // Um erro por vez: concatenar tudo virava uma frase ilegível na tela.
    const primeiro = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .find((mensagem): mensagem is string => Boolean(mensagem));
    return { error: primeiro || "Confira os dados e tente novamente." };
  }

  const data = parseResult.data;

  /*
   * O chamado de correção nasce da diferença entre a ficha publicada e o que
   * a pessoa enviou. A lista de alterações é gravada dentro do chamado: é ela
   * que a equipe aprova no painel — nada é aplicado direto no comércio.
   */
  let alteracoes: AlteracaoCampo[] = [];
  let slugDoNegocio: string | null = null;

  if (data.negocioId) {
    const alvo = await db.query.negocio.findFirst({
      where: (n, { eq }) => eq(n.id, data.negocioId as string),
      columns: { id: true, nome: true, descricao: true, slug: true },
      with: {
        contatos: true,
        localizacao: true,
        categorias: { with: { categoria: true } },
      },
    });

    if (!alvo) {
      return { error: "O comércio que você quer corrigir não existe mais." };
    }

    slugDoNegocio = alvo.slug;

    const whatsappAtual =
      alvo.contatos.find((c) => c.tipo === "whatsapp")?.valor ?? "";
    const categoriasAtuais = alvo.categorias.map((c) => c.categoria.nome);

    alteracoes = calcularAlteracoes(
      {
        nome: alvo.nome,
        descricao: alvo.descricao,
        whatsapp: whatsappAtual,
        bairro: alvo.localizacao?.bairro ?? "",
        endereco: alvo.localizacao?.endereco ?? "",
        categorias: categoriasAtuais,
      },
      {
        nome: data.nomeNegocio,
        descricao: data.descricao,
        // Campos que o formulário não enviou ficam como estão: o chamado não
        // pode "mudar" algo que a pessoa nem viu na tela.
        whatsapp: data.contatos
          ? (data.contatos.find((c) => c.tipo === "whatsapp")?.valor ?? "")
          : whatsappAtual,
        bairro: data.localizacao?.bairro ?? alvo.localizacao?.bairro ?? "",
        endereco:
          data.localizacao?.endereco ?? alvo.localizacao?.endereco ?? "",
        categorias: data.categoriasIds
          ? await nomesDasCategorias(data.categoriasIds)
          : categoriasAtuais,
      },
    );

    if (alteracoes.length === 0) {
      return {
        error:
          "Nenhuma informação mudou em relação à ficha publicada. Ajuste o campo que está errado para abrir o chamado.",
      };
    }
  }

  // Verificar duplicata (nível C - apenas alerta)
  const nomeNormalizado = data.nomeNegocio
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  /*
   * Checagem de duplicata é só um alerta. Quando o chamado não trouxe
   * contato (caso típico da correção), não há telefone para comparar —
   * mandar um texto sentinela para o ILIKE quebra com erro de codificação
   * no Postgres (22021).
   */
  const contatoDoChamado = data.contatos?.[0]?.valor.replace(/\D/g, "");
  const [duplicataNome, duplicataContato] = await Promise.all([
    db.query.negocio.findFirst({
      where: (n, { sql }) =>
        sql`${colunaNormalizada(negocio.nome)} = ${nomeNormalizado}`,
    }),
    contatoDoChamado
      ? db.query.contato.findFirst({
          where: (c, { sql }) =>
            sql`${contato.valor} ILIKE ${"%" + contatoDoChamado + "%"}`,
          with: { negocio: true },
        })
      : Promise.resolve(undefined),
  ]);

  const duplicataDetectada = !!duplicataNome || !!duplicataContato;

  // Buscar termos vigentes
  const termosVigentes = await Promise.all([
    db.query.documentoTermo.findFirst({
      where: (d, { eq }) => and(eq(d.tipo, "termos_uso"), eq(d.vigente, true)),
    }),
    db.query.documentoTermo.findFirst({
      where: (d, { eq }) =>
        and(eq(d.tipo, "politica_privacidade"), eq(d.vigente, true)),
    }),
    db.query.documentoTermo.findFirst({
      where: (d, { eq }) =>
        and(eq(d.tipo, "tratamento_dados"), eq(d.vigente, true)),
    }),
  ]);

  // Criar tudo em transação
  const resultado = await db.transaction(async (tx) => {
    // Criar solicitante
    const novoSolicitanteResult = await tx
      .insert(solicitante)
      .values({
        nome: data.nomeSolicitante.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone.trim(),
      })
      .returning();
    const novoSolicitante = novoSolicitanteResult[0];
    if (!novoSolicitante) throw new Error("Falha ao criar solicitante");

    // Preparar dados do negócio proposto (snapshot)
    const dadosNegocioProposto = {
      nome: data.nomeNegocio.trim(),
      descricao: data.descricao.trim(),
      // Contatos/lugares só entram no snapshot quando foram enviados; a
      // aprovação usa a ausência para saber que não deve mexer neles.
      ...(data.contatos ? { contatos: data.contatos } : {}),
      ...(data.localizacao ? { localizacao: data.localizacao } : {}),
      // Só grava horários se o chamado realmente os trouxe: a aprovação não
      // pode apagar o horário publicado por omissão do formulário.
      ...(data.horarios && data.horarios.length > 0
        ? { horarios: data.horarios }
        : {}),
      categoriasIds: data.categoriasIds,
      sugestaoCategoria: data.sugestaoCategoria,
      // A lista do que muda é o corpo do chamado que a equipe aprova.
      alteracoes,
    };

    // Verificar se há negócio em oculto_contestacao para lógica de em_fila_contestacao
    let negocioEmContestacao = false;
    // Se o usuário informou um negócio existente, verificar se está em contestacao
    // Isso seria feito via parâmetro hidden no form ou lógica de negócio

    // Criar solicitação
    const novaSolicitacaoResult = await tx
      .insert(solicitacao)
      .values({
        solicitanteId: novoSolicitante.id,
        tipo: "atualizacao",
        negocioId: data.negocioId ?? null,
        situacao: negocioEmContestacao ? "em_fila_contestacao" : "recebida",
        declaracaoVinculo: data.declaracaoVinculo.trim(),
        dadosNegocioProposto,
        duplicataDetectada: false,
      })
      .returning();
    const novaSolicitacao = novaSolicitacaoResult[0];
    if (!novaSolicitacao) throw new Error("Falha ao criar solicitação");

    // Sugestão de categoria se fornecida
    if (data.sugestaoCategoria?.trim()) {
      await tx.insert(sugestaoCategoria).values({
        solicitacaoId: novaSolicitacao.id,
        textoSugerido: data.sugestaoCategoria.trim(),
        situacao: "pendente",
      });
    }

    // Aceites de termos
    for (const doc of termosVigentes) {
      if (doc) {
        await tx.insert(aceiteTermo).values({
          solicitanteId: novoSolicitante.id,
          documentoTermoId: doc.id,
        });
      }
    }

    // Evento específico: o tipo correto é "atualizacao" (antes gravava
    // "inclusao" e contaminava o relatório de origem das solicitações).
    await tx.insert(logSolicitacaoRecebida).values({
      atorTipo: "solicitante",
      solicitacaoId: novaSolicitacao.id,
      tipo: "atualizacao",
    });

    // Índice de auditoria (RF-062). O solicitante é anônimo: sem ator_id.
    await appendLog(
      {
        ...(await contextoDaRequisicao("solicitante")),
        acao: "enviar_solicitacao_atualizacao",
        entidadeTipo: "solicitacao",
        entidadeId: novaSolicitacao.id,
        detalhes: {
          tipo: "atualizacao",
          temSugestaoCategoria: Boolean(data.sugestaoCategoria?.trim()),
        },
      },
      tx,
    );

    return { solicitacao: novaSolicitacao, duplicataDetectada: false };
  });

  const protocolo = protocoloDaSolicitacao(resultado.solicitacao.id);

  // Mesma confirmação da inclusão: chamado não pode ficar sem resposta.
  await notificarSolicitacaoRecebida({
    emailSolicitante: data.email.toLowerCase().trim(),
    nomeSolicitante: data.nomeSolicitante.trim(),
    nomeNegocio: data.nomeNegocio.trim(),
    protocolo,
    tipo: "atualizacao",
    alteracoes: alteracoes.map((a) => ({
      rotulo: a.rotulo,
      de: a.de,
      para: a.para,
    })),
  });

  return {
    success: true,
    solicitacao: resultado.solicitacao,
    duplicataDetectada: resultado.duplicataDetectada,
    protocolo,
    slug: slugDoNegocio,
    alteracoes,
  };
}
