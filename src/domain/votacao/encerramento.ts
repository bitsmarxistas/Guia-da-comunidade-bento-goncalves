// src/domain/votacao/encerramento.ts
import type { SituacaoVotacao } from "@/domain/enums";
import { apurarVotacao, type VotoInfo } from "@/domain/state-machines/votacao";

/** Situações terminais possíveis ao encerrar uma votação. */
export type ResultadoVotacao = Exclude<SituacaoVotacao, "em_andamento">;

export interface VotacaoComPrazo {
  situacao: SituacaoVotacao;
  encerraEm: Date;
}

/**
 * Regra de encerramento por tempo (24 h).
 *
 * Uma votação só vence enquanto ainda está `em_andamento`; votações terminais
 * nunca são recalculadas. O limite é inclusivo (`encerraEm <= agora`), igual
 * ao usado pelo cron e pelo `UPDATE` condicional que fecha a votação.
 */
export function votacaoVencida(
  votacao: VotacaoComPrazo,
  agora: Date = new Date(),
): boolean {
  if (votacao.situacao !== "em_andamento") return false;
  return votacao.encerraEm.getTime() <= agora.getTime();
}

export interface ResultadoEncerramentoPorPrazo {
  situacao: ResultadoVotacao;
  aprovacoes: number;
  rejeicoes: number;
  totalVotos: number;
  quorumCompleto: boolean;
}

/**
 * Apura uma votação no instante em que o prazo vence.
 *
 * - Quórum completo: mesma regra da apuração manual (maioria simples; empate
 *   vira `sem_aprovacao`).
 * - Quórum incompleto: a votação não pode aprovar nada, então encerra como
 *   `sem_aprovacao` (mesma consequência de RF-038 para o negócio), mas os
 *   votos efetivamente registrados continuam contabilizados no histórico.
 */
export function apurarEncerramentoPorPrazo(
  votos: VotoInfo[],
  adminsAtivos: Set<string>,
): ResultadoEncerramentoPorPrazo {
  const apuracao = apurarVotacao(votos, adminsAtivos);

  if (
    adminsAtivos.size > 0 &&
    apuracao.quorumCompleto &&
    apuracao.situacao !== "em_andamento"
  ) {
    return {
      situacao: apuracao.situacao,
      aprovacoes: apuracao.aprovacoes,
      rejeicoes: apuracao.rejeicoes,
      totalVotos: apuracao.aprovacoes + apuracao.rejeicoes,
      quorumCompleto: true,
    };
  }

  const votosAtivos = votos.filter((voto) => voto.estado === "ativo");
  const aprovacoes = votosAtivos.filter(
    (voto) => voto.escolha === "aprovacao",
  ).length;
  const rejeicoes = votosAtivos.filter(
    (voto) => voto.escolha === "rejeicao",
  ).length;

  return {
    situacao: "sem_aprovacao",
    aprovacoes,
    rejeicoes,
    totalVotos: aprovacoes + rejeicoes,
    quorumCompleto: false,
  };
}
