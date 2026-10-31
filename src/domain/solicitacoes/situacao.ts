// src/domain/solicitacoes/situacao.ts
import type { SituacaoSolicitacao } from "@/domain/enums";

/**
 * Fonte única dos rótulos e das cores de situação da solicitação.
 *
 * Antes cada tela tinha a própria lista — e todas usavam "reprovada", que não
 * existe no domínio (o estado é "rejeitada"). O resultado era uma solicitação
 * rejeitada aparecendo como o texto cru "rejeitada" na lista e o filtro
 * oferecendo uma opção que nunca encontrava nada.
 */
export const SITUACOES_SOLICITACAO: readonly SituacaoSolicitacao[] = [
  "recebida",
  "em_analise",
  "aguardando_correcao",
  "incompleta",
  "em_fila_contestacao",
  "aprovada",
  "rejeitada",
  "em_votacao",
  "votacao_aprovada",
  "votacao_rejeitada",
  "votacao_sem_aprovacao",
  "cancelada_por_contestacao",
] as const;

export const ROTULO_SITUACAO: Record<string, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  aguardando_correcao: "Aguardando correção",
  incompleta: "Incompleta",
  em_fila_contestacao: "Em fila de contestação",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  em_votacao: "Em votação",
  votacao_aprovada: "Aprovada por votação",
  votacao_rejeitada: "Rejeitada por votação",
  votacao_sem_aprovacao: "Votação sem aprovação",
  cancelada_por_contestacao: "Cancelada por contestação",
};

export const CLASSE_SITUACAO: Record<string, string> = {
  recebida: "border-brand/20 bg-brand-tint text-brand-strong",
  em_analise: "border-brand/20 bg-brand-tint text-brand-strong",
  aguardando_correcao: "border-warning/30 bg-warning-tint text-warning",
  incompleta: "border-line bg-surface-2 text-ink-soft",
  em_fila_contestacao: "border-warning/30 bg-warning-tint text-warning",
  aprovada: "border-positive/30 bg-positive-tint text-positive",
  rejeitada: "border-critical/30 bg-critical-tint text-critical",
  em_votacao: "border-warning/30 bg-warning-tint text-warning",
  votacao_aprovada: "border-positive/30 bg-positive-tint text-positive",
  votacao_rejeitada: "border-critical/30 bg-critical-tint text-critical",
  votacao_sem_aprovacao: "border-line bg-surface-2 text-ink-soft",
  cancelada_por_contestacao: "border-line bg-surface-2 text-ink-soft",
};

/** Estados em que o administrador ainda pode decidir (aprovar/reprovar/pedir correção). */
export const SITUACOES_DECIDIVEIS: readonly string[] = [
  "recebida",
  "em_analise",
  "incompleta",
  "aguardando_correcao",
  "em_fila_contestacao",
];

export function situacaoDecidivel(situacao: string): boolean {
  return SITUACOES_DECIDIVEIS.includes(situacao);
}

/**
 * Por que a decisão está bloqueada — a tela mostra isto em vez do genérico
 * "Já analisada", que fazia o admin achar que a aprovação estava quebrada.
 */
export function motivoBloqueioDecisao(situacao: string): string | null {
  if (situacaoDecidivel(situacao)) return null;
  if (situacao === "em_votacao") {
    return "Em votação: a decisão individual fica suspensa até a votação ser concluída em Votações.";
  }
  if (
    situacao.startsWith("votacao_") ||
    situacao === "cancelada_por_contestacao"
  ) {
    return "Decisão encerrada por votação da comunidade.";
  }
  if (situacao === "aprovada") return "Solicitação já aprovada e publicada.";
  if (situacao === "rejeitada") return "Solicitação já rejeitada.";
  return "Esta solicitação não aceita mais decisão.";
}

export function rotuloSituacao(situacao: string): string {
  return ROTULO_SITUACAO[situacao] ?? situacao;
}

export function classeSituacao(situacao: string): string {
  return CLASSE_SITUACAO[situacao] ?? "border-line bg-surface-2 text-ink-soft";
}
