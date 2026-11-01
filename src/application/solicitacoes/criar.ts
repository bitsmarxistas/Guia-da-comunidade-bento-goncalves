// src/application/solicitacoes/criar.ts
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
  imagem,
  anexo,
} from "@/infrastructure/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { normalizarTexto } from "@/domain/utils/normalizar-texto";
import { logSolicitacaoRecebida } from "@/infrastructure/db/schema/logs";
import { protocoloDaSolicitacao } from "@/domain/solicitacoes/protocolo";
import { notificarSolicitacaoRecebida } from "@/infrastructure/email/participacao";
import { colunaNormalizada } from "@/infrastructure/db/sql/normalizado";
import {
  MAX_ANEXOS_POR_SOLICITACAO,
  MAX_FOTOS_POR_SOLICITACAO,
} from "@/domain/midia/arquivo";
import { normalizarMidiasEnviadas } from "@/application/midia/upload-publico";
import { objetoExiste } from "@/infrastructure/r2/client";

/*
 * Mensagens em português, uma por campo.
 *
 * O relato "Too small: expected string to have >=10 characters" era o texto
 * cru do Zod aparecendo na tela quando o telefone ficava em branco — o wizard
 * sempre enviava o campo, e min(10) recusava. Agora o telefone é opcional
 * (validado só quando preenchido) e todo erro tem frase própria.
 */
const TelefoneOpcional = z
  .string()
  .optional()
  .transform((valor) => (valor ?? "").replace(/\\D/g, ""))
  .refine(
    (digitos) =>
      digitos.length === 0 || (digitos.length >= 10 && digitos.length <= 11),
    {
      message:
        "Telefone deve ter DDD + número (10 ou 11 dígitos), ou ficar em branco.",
    },
  );

const criarSolicitacaoSchema = z.object({
  // Dados do solicitante
  nomeSolicitante: z.string().min(1, "Informe seu nome.").max(120),
  email: z.string().email("Informe um e-mail válido."),
  telefone: TelefoneOpcional,
  // Dados do negócio
  nomeNegocio: z.string().min(1, "Informe o nome do comércio.").max(150),
  descricao: z.string().min(1, "Descreva o comércio."),
  contatos: z
    .array(
      z.object({
        tipo: z.enum(["whatsapp", "telefone", "instagram", "email", "outro"]),
        valor: z.string().min(1, "Contato vazio."),
        ordem: z.number().default(0),
      }),
    )
    .min(1, "Informe ao menos um contato do comércio."),
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
  // Declaração e aceite
  declaracaoVinculo: z.string().min(1, "Declare seu vínculo com o comércio."),
  aceiteTermos: z
    .boolean()
    .refine((v) => v === true, "É obrigatório aceitar os termos"),
});

export async function criarSolicitacaoAction(
  prevState: unknown,
  formData: FormData,
) {
  const rawData = {
    nomeSolicitante: formData.get("nomeSolicitante"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    nomeNegocio: formData.get("nomeNegocio"),
    descricao: formData.get("descricao"),
    contatos: formData.get("contatos")
      ? JSON.parse(formData.get("contatos") as string)
      : [],
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
  };

  const parseResult = criarSolicitacaoSchema.safeParse(rawData);
  if (!parseResult.success) {
    // Um erro por vez: concatenar tudo virava uma frase ilegível na tela.
    const primeiro = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .find((mensagem): mensagem is string => Boolean(mensagem));
    return { error: primeiro || "Confira os dados e tente novamente." };
  }

  const data = parseResult.data;

  /*
   * Fotos e anexos: o navegador já gravou os arquivos no bucket e manda só a
   * chave. Aqui a URL é conferida contra o nosso domínio público, o número de
   * arquivos é limitado e cada objeto é confirmado no bucket antes de virar
   * linha — sem isso, um formulário adulterado publicaria imagem de terceiros
   * na ficha do comércio.
   */
  const fotosRecebidas = normalizarMidiasEnviadas(formData.get("imagens"), {
    finalidade: "imagem",
    maximo: MAX_FOTOS_POR_SOLICITACAO,
  });
  if (!fotosRecebidas.ok) {
    return { error: fotosRecebidas.erro };
  }

  const anexosRecebidos = normalizarMidiasEnviadas(formData.get("anexos"), {
    finalidade: "anexo",
    maximo: MAX_ANEXOS_POR_SOLICITACAO,
  });
  if (!anexosRecebidos.ok) {
    return { error: anexosRecebidos.erro };
  }

  const [fotosExistentes, anexosExistentes] = await Promise.all([
    Promise.all(
      fotosRecebidas.midias.map(async (foto) => ({
        foto,
        existe: await objetoExiste(foto.key),
      })),
    ),
    Promise.all(
      anexosRecebidos.midias.map(async (anexoSolicitado) => ({
        anexoSolicitado,
        existe: await objetoExiste(anexoSolicitado.key),
      })),
    ),
  ]);

  if (fotosExistentes.some((item) => !item.existe)) {
    return {
      error:
        "Uma das fotos não chegou ao servidor. Remova-a e envie novamente antes de concluir.",
    };
  }

  if (anexosExistentes.some((item) => !item.existe)) {
    return {
      error:
        "Um dos anexos não chegou ao servidor. Remova-o e envie novamente antes de concluir.",
    };
  }

  const fotos = fotosExistentes.map((item) => item.foto);
  const anexosValidos = anexosExistentes.map((item) => item.anexoSolicitado);

  // Verificar duplicata (nível C - apenas alerta)
  const nomeNormalizado = data.nomeNegocio
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const [duplicataNome, duplicataContato] = await Promise.all([
    db.query.negocio.findFirst({
      where: (n, { sql }) => sql`lower(${negocio.nome}) = ${nomeNormalizado}`,
    }),
    db.query.contato.findFirst({
      where: (c, { sql }) =>
        sql`${contato.valor} ILIKE ${"%" + data.contatos[0]?.valor.replace(/\D/g, "") + "%"}`,
      with: { negocio: true },
    }),
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
      contatos: data.contatos,
      localizacao: data.localizacao,
      horarios: data.horarios,
      categoriasIds: data.categoriasIds,
      sugestaoCategoria: data.sugestaoCategoria,
    };

    // Criar solicitação
    const novaSolicitacaoResult = await tx
      .insert(solicitacao)
      .values({
        solicitanteId: novoSolicitante.id,
        tipo: "inclusao",
        situacao: "recebida",
        declaracaoVinculo: data.declaracaoVinculo.trim(),
        dadosNegocioProposto,
        duplicataDetectada,
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

    // Fotos: entram pendentes de moderação, presas à solicitação. Só ganham
    // `negocioId` quando a equipe aprova o cadastro.
    for (const foto of fotos) {
      await tx.insert(imagem).values({
        solicitacaoId: novaSolicitacao.id,
        negocioId: null,
        tipo: foto.tipo === "logo" ? "logo" : "foto",
        situacao: "pendente",
        url: foto.url,
      });
    }

    // Anexos: documentos de apoio que a equipe consulta ao analisar.
    for (const arquivo of anexosValidos) {
      await tx.insert(anexo).values({
        solicitacaoId: novaSolicitacao.id,
        arquivoUrl: arquivo.url,
        nomeOriginal: (arquivo.nomeOriginal ?? "arquivo").slice(0, 255),
        mimeType: (arquivo.mimeType ?? "application/octet-stream").slice(
          0,
          100,
        ),
        tamanhoBytes: Math.max(0, Math.round(arquivo.tamanhoBytes ?? 0)),
        situacao: "recebido",
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

    // Log de auditoria
    await tx.insert(logSolicitacaoRecebida).values({
      atorTipo: "solicitante",
      solicitacaoId: novaSolicitacao.id,
      tipo: "inclusao",
    });

    return { solicitacao: novaSolicitacao, duplicataDetectada };
  });

  // TODO: Detectar se negócio relacionado está em oculto_contestacao e criar em em_fila_contestacao
  // (seria necessário verificar negocioId vinculado, mas na inclusão não há vínculo prévio)

  /*
   * Confirmação por e-mail: antes não existia e-mail nenhum neste ponto — quem
   * enviava a inclusão só recebia algo quando um admin decidia (e às vezes
   * nunca). Se o envio falhar, a solicitação continua criada.
   */
  await notificarSolicitacaoRecebida({
    emailSolicitante: data.email.toLowerCase().trim(),
    nomeSolicitante: data.nomeSolicitante.trim(),
    nomeNegocio: data.nomeNegocio.trim(),
    protocolo: protocoloDaSolicitacao(resultado.solicitacao.id),
    tipo: "inclusao",
  });

  return {
    success: true,
    solicitacao: resultado.solicitacao,
    duplicataDetectada: resultado.duplicataDetectada,
    protocolo: protocoloDaSolicitacao(resultado.solicitacao.id),
  };
}

export async function detectarDuplicataPublica(
  nome: string,
  contatos: string[],
) {
  const nomeNormalizado = nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const [porNome, porContato] = await Promise.all([
    db.query.negocio.findMany({
      where: (n, { sql }) =>
        sql`${colunaNormalizada(negocio.nome)} LIKE ${"%" + nomeNormalizado + "%"}`,
      limit: 5,
    }),
    db.query.contato.findMany({
      where: (c, { inArray }) => inArray(c.valor, contatos),
      with: { negocio: true },
      limit: 5,
    }),
  ]);

  // Unificar e remover duplicados
  const map = new Map();
  for (const n of porNome) map.set(n.id, n);
  for (const c of porContato)
    if (c.negocio && (c.negocio as any).id)
      map.set((c.negocio as any).id, c.negocio);

  return Array.from(map.values());
}
