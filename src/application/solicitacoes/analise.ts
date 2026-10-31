// src/application/solicitacoes/analise.ts
"use server";

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import {
  solicitacao,
  negocio,
  solicitante,
  contato,
  localizacao,
  horarioFuncionamento,
  negocioCategoria,
} from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import {
  logSolicitacaoAnalisada,
  logVinculacaoSolicitacao,
  logNegocio,
  logComunicacao,
} from "@/infrastructure/db/schema/logs";
import { enviarEmailAnaliseSolicitacao } from "@/infrastructure/email/client";
import { revalidatePath } from "next/cache";
import { appendLog } from "@/infrastructure/audit/audit.service";
import { exigirContextoAdmin } from "@/lib/audit-context";
import { normalizarSlug } from "@/domain/utils/normalizar-slug";
import { gerarSlugUnico } from "@/domain/utils/gerar-slug-unico";
import { ErroDominio } from "@/domain/errors/domain-error";
import { JustificativaObrigatoria } from "@/domain/errors";
import {
  motivoBloqueioDecisao,
  situacaoDecidivel,
} from "@/domain/solicitacoes/situacao";
import { situacaoDaDecisao } from "@/domain/solicitacoes/decidir";

const analisarSolicitacaoSchema = z.object({
  solicitacaoId: z.string().uuid(),
  decisao: z.enum(["aprovar", "reprovar", "solicitar_correcao"]),
  justificativa: z.string().optional(),
  observacoesInternas: z.string().optional(),
});

interface LocalizacaoProposta {
  endereco?: string;
  bairro?: string;
  areaAtendimento?: string;
  cep?: string;
  numero?: string;
  semPontoComercial?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Traduz o snapshot da solicitação para as colunas de `localizacao`.
 * O endereço estruturado (CEP/número) e as coordenadas passam a ser gravados
 * na aprovação — antes só rua, bairro e área chegavam na ficha.
 */
function valoresLocalizacao(loc: LocalizacaoProposta) {
  const temCoordenadas =
    typeof loc.latitude === "number" && typeof loc.longitude === "number";

  return {
    endereco: loc.endereco?.trim() || null,
    bairro: loc.bairro?.trim() || null,
    areaAtendimento: loc.areaAtendimento?.trim() || null,
    cep: loc.cep?.trim() || null,
    numero: loc.numero?.toString().trim() || null,
    semPontoComercial: Boolean(loc.semPontoComercial),
    latitude: temCoordenadas ? (loc.latitude as number) : null,
    longitude: temCoordenadas ? (loc.longitude as number) : null,
    geocodificadoEm: temCoordenadas ? new Date() : null,
  };
}

export async function analisarSolicitacaoAction(
  prevState: unknown,
  formData: FormData,
) {
  const rawData = {
    solicitacaoId: formData.get("solicitacaoId"),
    decisao: formData.get("decisao"),
    justificativa: formData.get("justificativa") || undefined,
    observacoesInternas: formData.get("observacoesInternas") || undefined,
  };

  const parseResult = analisarSolicitacaoSchema.safeParse(rawData);
  if (!parseResult.success) {
    const errorMsg = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { error: errorMsg || "Dados inválidos" };
  }

  const { solicitacaoId, decisao, justificativa, observacoesInternas } =
    parseResult.data;

  // Autoriza a action e fornece o ator/ip para o log de auditoria.
  const contexto = await exigirContextoAdmin();

  const sol = (await db.query.solicitacao.findFirst({
    where: (s, { eq }) => eq(s.id, solicitacaoId),
    with: {
      solicitante: true,
      categoriasSugeridas: true,
    },
  })) as any;

  if (!sol) {
    return { error: "Solicitação não encontrada" };
  }

  /*
   * Quem decide: a máquina ME-01 é a autoridade. Antes esta action aceitava
   * apenas "recebida"/"em_fila_contestacao" e recusava "em_analise" — o estado
   * em que a solicitação fica depois de aberta —, então o admin via
   * "Já analisada" e não conseguia aprovar nada que não fosse recém-chegado.
   */
  if (!situacaoDecidivel(sol.situacao)) {
    return {
      error:
        motivoBloqueioDecisao(sol.situacao) ??
        "Solicitação não pode ser analisada no estado atual.",
    };
  }

  let situacaoFinal: string;
  try {
    situacaoFinal = situacaoDaDecisao(sol.situacao, decisao, {
      adminId: contexto.atorId ?? "sistema",
      justificativa,
      dadosCompletos: true,
    });
  } catch (erro) {
    if (erro instanceof JustificativaObrigatoria) {
      return {
        error:
          "Justificativa é obrigatória para reprovar ou solicitar correção.",
      };
    }
    return {
      error:
        erro instanceof Error
          ? `Não foi possível registrar a decisão: ${erro.message}`
          : "Não foi possível registrar a decisão.",
    };
  }

  let resultado: { situacao: string; negocioId?: string } = { situacao: "" };

  try {
    await db.transaction(async (tx) => {
      if (decisao === "aprovar") {
        // Criar negócio a partir dos dados propostos
        const dados = sol.dadosNegocioProposto as Record<string, unknown>;

        if (sol.tipo === "atualizacao" && sol.negocioId) {
          /**
           * Correção aprovada = MODIFICAR o comércio existente.
           * Antes, aprovar uma solicitação do tipo "atualizacao" criava um segundo
           * cadastro do mesmo comércio (o fluxo só sabia inserir). Aqui o pedido
           * de correção atualiza a ficha e mantém o slug/URL estável.
           */
          const [alvo] = await tx
            .select({
              id: negocio.id,
              nome: negocio.nome,
              descricao: negocio.descricao,
            })
            .from(negocio)
            .where(eq(negocio.id, sol.negocioId))
            .limit(1);

          if (!alvo) {
            throw new ErroDominio(
              "NEGOCIO_INEXISTENTE",
              "O comércio desta correção não existe mais.",
            );
          }

          const snapshotAntes = {
            nome: alvo.nome,
            descricao: alvo.descricao,
          };

          // Só sobrescreve o que o chamado realmente pediu para mudar.
          await tx
            .update(negocio)
            .set({
              nome: (dados.nome as string) || alvo.nome,
              descricao: (dados.descricao as string) || alvo.descricao,
              atualizadoEm: new Date(),
            })
            .where(eq(negocio.id, alvo.id));

          const contatosDoChamado =
            (dados.contatos as Array<{
              tipo: string;
              valor: string;
              ordem: number;
            }>) ?? [];

          if (contatosDoChamado.length > 0) {
            await tx.delete(contato).where(eq(contato.negocioId, alvo.id));
          }
          for (const c of (dados.contatos as Array<{
            tipo: string;
            valor: string;
            ordem: number;
          }>) ?? []) {
            await tx.insert(contato).values({
              negocioId: alvo.id,
              tipo: c.tipo,
              valor: c.valor,
              ordem: c.ordem,
            });
          }

          /*
           * Localização: mescla em vez de substituir.
           * O chamado de correção manda só rua e bairro; recriar a linha
           * zerava CEP, número, "sem ponto comercial" e as coordenadas do
           * mapa já geocodificadas.
           */
          if (dados.localizacao) {
            const valores = valoresLocalizacao(
              dados.localizacao as LocalizacaoProposta,
            );
            const [existente] = await tx
              .select({ id: localizacao.id })
              .from(localizacao)
              .where(eq(localizacao.negocioId, alvo.id))
              .limit(1);

            if (existente) {
              await tx
                .update(localizacao)
                .set({
                  endereco: valores.endereco,
                  bairro: valores.bairro,
                  areaAtendimento: valores.areaAtendimento,
                  cep: valores.cep,
                  numero: valores.numero,
                  semPontoComercial: valores.semPontoComercial,
                  latitude: valores.latitude,
                  longitude: valores.longitude,
                })
                .where(eq(localizacao.id, existente.id));
            } else {
              await tx.insert(localizacao).values({
                negocioId: alvo.id,
                ...valores,
              });
            }
          }

          /*
           * Horário só é tocado quando o chamado trouxe horários.
           * O formulário de correção não envia horários: antes, aprovar
           * "troque o telefone" apagava todo o horário de funcionamento.
           */
          if (Array.isArray(dados.horarios)) {
            await tx
              .delete(horarioFuncionamento)
              .where(eq(horarioFuncionamento.negocioId, alvo.id));
            for (const h of dados.horarios as Array<{
              diaSemana: number;
              horaAbertura: string;
              horaFechamento: string;
              observacao?: string;
            }>) {
              await tx.insert(horarioFuncionamento).values({
                negocioId: alvo.id,
                diaSemana: h.diaSemana,
                horaAbertura: h.horaAbertura,
                horaFechamento: h.horaFechamento,
                observacao: h.observacao,
              });
            }
          }

          await tx
            .delete(negocioCategoria)
            .where(eq(negocioCategoria.negocioId, alvo.id));
          for (const catId of (dados.categoriasIds as string[]) ?? []) {
            await tx.insert(negocioCategoria).values({
              negocioId: alvo.id,
              categoriaId: catId,
            });
          }

          await tx
            .update(solicitacao)
            .set({
              situacao: situacaoFinal,
              analisadaEm: new Date(),
              observacoesInternas,
            })
            .where(eq(solicitacao.id, solicitacaoId));

          resultado = { situacao: situacaoFinal, negocioId: alvo.id };

          await tx.insert(logSolicitacaoAnalisada).values({
            atorTipo: "admin",
            atorId: contexto.atorId,
            solicitacaoId,
            decisao: "aprovar",
            justificativa,
            negocioId: alvo.id,
          });

          await tx.insert(logNegocio).values({
            atorTipo: "admin",
            atorId: contexto.atorId,
            negocioId: alvo.id,
            acao: "atualizar_via_solicitacao",
            snapshotAntes: JSON.stringify(snapshotAntes),
            snapshotDepois: JSON.stringify(dados),
          });
        } else {
          // Gerar slug único
          const baseSlug = dados.nome
            ? normalizarSlug(dados.nome as string)
            : "sem-nome";
          const existentes = new Set(
            (await tx.select({ slug: negocio.slug }).from(negocio)).map(
              (n) => n.slug,
            ),
          );
          const slugUnico = gerarSlugUnico(baseSlug, existentes);

          const [novoNegocio] = await tx
            .insert(negocio)
            .values({
              slug: slugUnico,
              nome: dados.nome as string,
              descricao: dados.descricao as string,
              situacaoPublicacao: "publicado",
              fonte: "solicitacao_publica",
              solicitacaoOrigemId: sol.id,
            })
            .returning();

          if (!novoNegocio) throw new Error("Falha ao criar negócio");

          // Criar contatos
          const contatosData =
            (dados.contatos as Array<{
              tipo: string;
              valor: string;
              ordem: number;
            }>) || [];
          for (const c of contatosData) {
            await tx.insert(contato).values({
              negocioId: novoNegocio.id,
              tipo: c.tipo,
              valor: c.valor,
              ordem: c.ordem,
            });
          }

          // Criar localização se houver
          if (dados.localizacao) {
            await tx.insert(localizacao).values({
              negocioId: novoNegocio.id,
              ...valoresLocalizacao(dados.localizacao as LocalizacaoProposta),
            });
          }

          // Criar horários se houver
          const horariosData =
            (dados.horarios as Array<{
              diaSemana: number;
              horaAbertura: string;
              horaFechamento: string;
              observacao?: string;
            }>) || [];
          for (const h of horariosData) {
            await tx.insert(horarioFuncionamento).values({
              negocioId: novoNegocio.id,
              diaSemana: h.diaSemana,
              horaAbertura: h.horaAbertura,
              horaFechamento: h.horaFechamento,
              observacao: h.observacao,
            });
          }

          // Vincular categorias
          const categoriasIds = (dados.categoriasIds as string[]) || [];
          for (const catId of categoriasIds) {
            await tx.insert(negocioCategoria).values({
              negocioId: novoNegocio.id,
              categoriaId: catId,
            });
          }

          // Processar sugestão de categoria se houver
          if (sol.sugestaoCategoria && sol.sugestaoCategoria.length > 0) {
            const sug = sol.sugestaoCategoria[0];
            if (sug.situacao === "aceita" && sug.categoriaCriadaId) {
              await tx.insert(negocioCategoria).values({
                negocioId: novoNegocio.id,
                categoriaId: sug.categoriaCriadaId,
              });
            }
          }

          // Atualizar solicitação
          await tx
            .update(solicitacao)
            .set({
              situacao: situacaoFinal,
              negocioId: novoNegocio.id,
              analisadaEm: new Date(),
              observacoesInternas,
            })
            .where(eq(solicitacao.id, solicitacaoId));

          resultado = { situacao: situacaoFinal, negocioId: novoNegocio.id };

          // Log de auditoria
          await tx.insert(logSolicitacaoAnalisada).values({
            atorTipo: "admin",
            atorId: contexto.atorId,
            solicitacaoId,
            decisao: "aprovar",
            justificativa,
            negocioId: novoNegocio.id,
          });

          await tx.insert(logVinculacaoSolicitacao).values({
            atorTipo: "sistema",
            solicitacaoId,
            negocioIdDepois: novoNegocio.id,
          });

          await tx.insert(logNegocio).values({
            atorTipo: "sistema",
            negocioId: novoNegocio.id,
            acao: "criar_via_solicitacao",
            snapshotAntes: null,
            snapshotDepois: JSON.stringify(dados),
          });
        }
      } else if (decisao === "reprovar") {
        await tx
          .update(solicitacao)
          .set({
            situacao: situacaoFinal,
            analisadaEm: new Date(),
            observacoesInternas,
          })
          .where(eq(solicitacao.id, solicitacaoId));

        resultado = { situacao: situacaoFinal };

        // Log de auditoria
        await tx.insert(logSolicitacaoAnalisada).values({
          atorTipo: "admin",
          atorId: contexto.atorId,
          solicitacaoId,
          decisao: "reprovar",
          justificativa,
        });
      } else if (decisao === "solicitar_correcao") {
        await tx
          .update(solicitacao)
          .set({
            situacao: situacaoFinal,
            motivoIncompleta: justificativa,
            analisadaEm: new Date(),
            observacoesInternas,
          })
          .where(eq(solicitacao.id, solicitacaoId));

        resultado = { situacao: situacaoFinal };

        // Log de auditoria
        await tx.insert(logSolicitacaoAnalisada).values({
          atorTipo: "admin",
          atorId: contexto.atorId,
          solicitacaoId,
          decisao: "solicitar_correcao",
          justificativa,
        });
      }

      // Índice consultável de auditoria (RF-062): uma linha por decisão.
      await appendLog(
        {
          ...contexto,
          acao: `decidir_solicitacao_${decisao}`,
          entidadeTipo: "solicitacao",
          entidadeId: solicitacaoId,
          detalhes: {
            decisao,
            justificativa: justificativa ?? null,
            situacaoResultante: resultado.situacao,
          },
          snapshotAntes: { situacao: sol.situacao },
          snapshotDepois: {
            situacao: resultado.situacao,
            negocioId: resultado.negocioId ?? null,
          },
        },
        tx,
      );
    });
  } catch (erro) {
    // Erro de domínio (ex.: comércio da correção não existe mais) vira mensagem
    // na tela; qualquer outra falha aborta a transação inteira e nada é gravado.
    if (erro instanceof ErroDominio) {
      return { error: erro.message };
    }
    console.error("[Análise] Falha ao registrar decisão:", erro);
    return {
      error:
        "Falha ao registrar a decisão. Nada foi alterado — tente novamente.",
    };
  }

  // Slug para o link "ver a ficha": a rota pública é /negocio/[slug], não /[id].
  let negocioSlug: string | undefined;
  if (resultado.negocioId) {
    const [alvo] = await db
      .select({ slug: negocio.slug })
      .from(negocio)
      .where(eq(negocio.id, resultado.negocioId))
      .limit(1);
    negocioSlug = alvo?.slug;
  }

  // Enviar e-mail transacional
  if (sol.solicitante) {
    const nomeNegocio = (sol.dadosNegocioProposto as Record<string, unknown>)
      .nome as string;
    // O log de comunicação registra o resultado REAL do envio: um e-mail que
    // falhou não pode aparecer como sucesso na auditoria.
    let envioOk = false;
    let erroEnvio: string | null = null;

    try {
      const envio = await enviarEmailAnaliseSolicitacao(
        sol.solicitante.email,
        sol.solicitante.nome,
        nomeNegocio,
        decisao,
        justificativa,
      );
      envioOk = envio.success;
      erroEnvio = envio.error ?? null;
    } catch (erro) {
      erroEnvio = erro instanceof Error ? erro.message : "erro desconhecido";
    }

    if (!envioOk) {
      console.error("[Análise] Falha ao enviar e-mail:", erroEnvio);
    }

    await db.insert(logComunicacao).values({
      atorTipo: "sistema",
      tipo: "analise_solicitacao",
      destinatario: sol.solicitante.email,
      sucesso: envioOk,
      erro: erroEnvio,
    });
  }

  revalidatePath("/admin/solicitacoes");

  return {
    success: true,
    situacao: resultado?.situacao,
    negocioId: resultado?.negocioId,
    negocioSlug,
  };
}
