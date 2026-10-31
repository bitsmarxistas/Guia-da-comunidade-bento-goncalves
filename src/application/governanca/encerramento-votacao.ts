// src/application/governanca/encerramento-votacao.ts
import { and, eq, lte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "@/infrastructure/db/client";
import type * as schema from "@/infrastructure/db/schema";
import {
  contestacao as contestacaoTable,
  negocio as negocioTable,
  solicitacao as solicitacaoTable,
  votacao as votacaoTable,
} from "@/infrastructure/db/schema";
import {
  logContestacao,
  logNegocio,
  logSolicitacaoAnalisada,
  logVotacao,
} from "@/infrastructure/db/schema/logs";
import { appendLog } from "@/infrastructure/audit/audit.service";
import type {
  AtorTipo,
  EscolhaVoto,
  SituacaoSolicitacao,
} from "@/domain/enums";
import { ErroTransicaoInvalida } from "@/domain/errors";
import { transicionarSolicitacao } from "@/domain/state-machines";
import {
  apurarEncerramentoPorPrazo,
  votacaoVencida,
  type ResultadoEncerramentoPorPrazo,
} from "@/domain/votacao/encerramento";

type Executor = Pick<
  PostgresJsDatabase<typeof schema>,
  "select" | "insert" | "update"
>;

export interface ContextoEncerramento {
  atorTipo: AtorTipo;
  atorId: string | null;
  ipOrigem?: string;
  userAgent?: string;
}

export interface DadosEncerramentoVotacao {
  votacaoId: string;
  contestacaoId: string;
  negocioId: string;
  solicitacaoOrigemId: string | null;
  resultado: ResultadoEncerramentoPorPrazo;
  contexto: ContextoEncerramento;
  agora: Date;
  /** Quando true, o UPDATE também exige "encerra_em <= agora". */
  exigirPrazoVencido: boolean;
  acaoLog: "apurar" | "encerrar_por_prazo";
}

/**
 * Aplica o encerramento de UMA votação dentro da transação recebida.
 *
 * O UPDATE condicional em "situacao = 'em_andamento'" é a trava de
 * idempotência: só a primeira execução (cron, leitura preguiçosa ou
 * apuração manual) conquista a linha e roda os efeitos colaterais. Se a
 * votação já foi encerrada por outra execução concorrente, devolve false
 * sem recalcular nem duplicar logs/transições.
 */
export async function aplicarEncerramentoVotacao(
  tx: Executor,
  dados: DadosEncerramentoVotacao,
): Promise<boolean> {
  const { resultado, contexto } = dados;

  const [votacaoEncerrada] = await tx
    .update(votacaoTable)
    .set({
      situacao: resultado.situacao,
      encerradaEm: dados.agora,
      resultado: resultado.situacao,
      totalVotos: resultado.totalVotos,
      votosSim: resultado.aprovacoes,
      votosNao: resultado.rejeicoes,
    })
    .where(
      and(
        eq(votacaoTable.id, dados.votacaoId),
        eq(votacaoTable.situacao, "em_andamento"),
        ...(dados.exigirPrazoVencido
          ? [lte(votacaoTable.encerraEm, dados.agora)]
          : []),
      ),
    )
    .returning({ id: votacaoTable.id });

  if (!votacaoEncerrada) {
    return false;
  }

  await tx
    .update(contestacaoTable)
    .set({ situacao: "encerrada", decididaEm: dados.agora })
    .where(
      and(
        eq(contestacaoTable.id, dados.contestacaoId),
        eq(contestacaoTable.situacao, "em_votacao"),
      ),
    );

  await tx.insert(logVotacao).values({
    atorTipo: contexto.atorTipo,
    atorId: contexto.atorId,
    votacaoId: dados.votacaoId,
    acao: dados.acaoLog,
    situacaoAnterior: "em_andamento",
    situacaoNova: resultado.situacao,
    resultado: resultado.situacao,
    totalVotos: resultado.totalVotos,
  });

  await tx.insert(logContestacao).values({
    atorTipo: contexto.atorTipo,
    atorId: contexto.atorId,
    contestacaoId: dados.contestacaoId,
    acao: "encerrar",
    situacaoAnterior: "em_votacao",
    situacaoNova: "encerrada",
  });

  await appendLog(
    {
      atorTipo: contexto.atorTipo,
      atorId: contexto.atorId,
      ipOrigem: contexto.ipOrigem ?? null,
      userAgent: contexto.userAgent ?? null,
      acao:
        dados.acaoLog === "apurar"
          ? "apurar_votacao"
          : "encerrar_votacao_por_prazo",
      entidadeTipo: "votacao",
      entidadeId: dados.votacaoId,
      detalhes: {
        contestacaoId: dados.contestacaoId,
        resultado: resultado.situacao,
        aprovacoes: resultado.aprovacoes,
        rejeicoes: resultado.rejeicoes,
        totalVotos: resultado.totalVotos,
        quorumCompleto: resultado.quorumCompleto,
        prazoVencido: dados.exigirPrazoVencido,
      },
      snapshotAntes: { situacao: "em_andamento" },
      snapshotDepois: { situacao: resultado.situacao },
    },
    tx,
  );

  if (dados.solicitacaoOrigemId) {
    const [solicitacao] = await tx
      .select({
        id: solicitacaoTable.id,
        situacao: solicitacaoTable.situacao,
      })
      .from(solicitacaoTable)
      .where(eq(solicitacaoTable.id, dados.solicitacaoOrigemId))
      .limit(1);

    if (solicitacao) {
      try {
        const novaSituacao = transicionarSolicitacao(
          solicitacao.situacao as SituacaoSolicitacao,
          "CONCLUIR_VOTACAO",
          { resultadoVotacao: resultado.situacao },
        );

        await tx
          .update(solicitacaoTable)
          .set({ situacao: novaSituacao })
          .where(eq(solicitacaoTable.id, solicitacao.id));

        await tx.insert(logSolicitacaoAnalisada).values({
          atorTipo: "sistema",
          atorId: null,
          solicitacaoId: solicitacao.id,
          decisao: rotuloDecisaoVotacao(resultado),
          justificativa:
            "Votação encerrada: " +
            resultado.aprovacoes +
            " a favor, " +
            resultado.rejeicoes +
            " contra" +
            (resultado.quorumCompleto ? "" : " (quórum incompleto)"),
        });
      } catch (erro) {
        if (!(erro instanceof ErroTransicaoInvalida)) throw erro;
      }
    }
  }

  const [negocio] = await tx
    .select({
      id: negocioTable.id,
      situacaoPublicacao: negocioTable.situacaoPublicacao,
    })
    .from(negocioTable)
    .where(eq(negocioTable.id, dados.negocioId))
    .limit(1);

  if (negocio) {
    const situacaoPublicacao =
      resultado.situacao === "aprovada" ? "publicado" : "nao_publicado";

    await tx
      .update(negocioTable)
      .set({ situacaoPublicacao })
      .where(eq(negocioTable.id, negocio.id));

    await tx.insert(logNegocio).values({
      atorTipo: "sistema",
      atorId: null,
      negocioId: negocio.id,
      acao:
        resultado.situacao === "aprovada"
          ? "votacao_aprovada"
          : "votacao_rejeitada_ou_empate",
      snapshotAntes: JSON.stringify({
        situacaoPublicacao: negocio.situacaoPublicacao,
      }),
      snapshotDepois: JSON.stringify({ situacaoPublicacao }),
    });
  }

  return true;
}

/**
 * log_solicitacao_analisada.decisao é varchar(20) e não pode ser alterada
 * (regra do projeto: sem schema/migration). "votacao_sem_aprovacao" tem 21
 * caracteres, então usamos rótulos equivalentes que caibam na coluna.
 */
function rotuloDecisaoVotacao(
  resultado: ResultadoEncerramentoPorPrazo,
): string {
  if (resultado.situacao === "aprovada") return "votacao_aprovada";
  if (resultado.situacao === "rejeitada") return "votacao_rejeitada";
  return resultado.quorumCompleto ? "votacao_empate" : "votacao_sem_quorum";
}

export interface RelatorioEncerramentoVotacoes {
  agora: Date;
  verificadas: number;
  encerradas: string[];
  ignoradas: string[];
  falhas: Array<{ votacaoId: string; erro: string }>;
}

/**
 * Encerramento preguiçoso/automático de todas as votações cujo encerraEm
 * já passou. É seguro chamar em renderização de página, cron ou action:
 *
 * - lê o prazo gravado no banco (votações antigas com outro prazo funcionam);
 * - cada votação é fechada em sua própria transação;
 * - uma falha isolada não impede as demais e volta no relatório.
 */
export async function encerrarVotacoesVencidas(
  agora: Date = new Date(),
): Promise<RelatorioEncerramentoVotacoes> {
  const vencidas = await db.query.votacao.findMany({
    where: (votacao, { and, eq, lte }) =>
      and(eq(votacao.situacao, "em_andamento"), lte(votacao.encerraEm, agora)),
    with: {
      votos: {
        columns: {
          adminId: true,
          escolha: true,
          criadoEm: true,
        },
      },
      contestacao: {
        columns: {
          id: true,
          negocioId: true,
          solicitacaoOrigemId: true,
        },
      },
    },
    orderBy: (votacao, { asc }) => [asc(votacao.encerraEm)],
  });

  const adminsAtivos = new Set(
    (
      await db.query.administrador.findMany({
        where: (admin, { eq }) => eq(admin.ativo, true),
        columns: { id: true },
      })
    ).map((admin) => admin.id),
  );

  const relatorio: RelatorioEncerramentoVotacoes = {
    agora,
    verificadas: vencidas.length,
    encerradas: [],
    ignoradas: [],
    falhas: [],
  };

  for (const votacao of vencidas) {
    if (!votacao.contestacao) {
      relatorio.falhas.push({
        votacaoId: votacao.id,
        erro: "Contestação vinculada não encontrada",
      });
      continue;
    }

    if (
      !votacaoVencida(
        { situacao: "em_andamento", encerraEm: votacao.encerraEm },
        agora,
      )
    ) {
      continue;
    }

    const resultado = apurarEncerramentoPorPrazo(
      votacao.votos.map((voto) => ({
        adminId: voto.adminId,
        escolha: voto.escolha as EscolhaVoto,
        estado: "ativo" as const,
        criadoEm: voto.criadoEm,
      })),
      adminsAtivos,
    );

    try {
      const aplicado = await db.transaction((tx) =>
        aplicarEncerramentoVotacao(tx, {
          votacaoId: votacao.id,
          contestacaoId: votacao.contestacao.id,
          negocioId: votacao.contestacao.negocioId,
          solicitacaoOrigemId: votacao.contestacao.solicitacaoOrigemId,
          resultado,
          contexto: { atorTipo: "sistema", atorId: null },
          agora,
          exigirPrazoVencido: true,
          acaoLog: "encerrar_por_prazo",
        }),
      );

      if (aplicado) {
        relatorio.encerradas.push(votacao.id);
      } else {
        relatorio.ignoradas.push(votacao.id);
      }
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : "erro desconhecido";
      console.error(
        "[Votação] Falha ao encerrar a votação " + votacao.id + ":",
        erro,
      );
      relatorio.falhas.push({ votacaoId: votacao.id, erro: mensagem });
    }
  }

  return relatorio;
}
