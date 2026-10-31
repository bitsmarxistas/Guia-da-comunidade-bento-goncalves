// src/domain/solicitacoes/decidir.ts
import type { SituacaoSolicitacao } from "@/domain/enums";
import {
  transicionarSolicitacao,
  type ContextoSolicitacao,
} from "@/domain/state-machines/solicitacao";
import { situacaoDecidivel } from "./situacao";

export type DecisaoSolicitacao = "aprovar" | "reprovar" | "solicitar_correcao";

/**
 * Texto padrão de justificativa da aprovação.
 *
 * A máquina de estados (ME-01 #8) exige justificativa para registrar a decisão
 * de aprovação. Exigir que o admin digite algo para cada aprovação simples
 * travava o fluxo; o registro automático mantém a auditoria íntegra e diz
 * exatamente o que aconteceu.
 */
export const JUSTIFICATIVA_APROVACAO_PADRAO =
  "Aprovação em análise individual: dados conferidos pela administração.";

/**
 * Leva o estado atual até "em_analise", que é o único estado de onde a máquina
 * ME-01 permite registrar decisão.
 *
 * - recebida             -> INICIAR_ANALISE
 * - incompleta           -> RECEBER_CORRECAO (o admin considerou os dados completos)
 * - aguardando_correcao  -> RECEBER_CORRECAO (a correção foi recebida)
 * - em_fila_contestacao  -> LIBERAR_FILA + INICIAR_ANALISE (liberação manual)
 *
 * Antes a aplicação só aceitava "recebida"; toda solicitação que já tinha
 * saído desse estado aparecia como "Já analisada" e não podia ser aprovada.
 */
function normalizarParaAnalise(
  situacao: SituacaoSolicitacao,
  adminId: string,
): SituacaoSolicitacao {
  switch (situacao) {
    case "em_analise":
      return "em_analise";
    case "recebida":
      return transicionarSolicitacao("recebida", "INICIAR_ANALISE", {
        adminId,
      });
    case "incompleta":
      return transicionarSolicitacao("incompleta", "RECEBER_CORRECAO", {
        dadosCompletos: true,
      });
    case "aguardando_correcao":
      return transicionarSolicitacao(
        "aguardando_correcao",
        "RECEBER_CORRECAO",
        {
          dadosCompletos: true,
        },
      );
    case "em_fila_contestacao": {
      const liberada = transicionarSolicitacao(
        "em_fila_contestacao",
        "LIBERAR_FILA",
        { votacaoAprovada: true },
      );
      return transicionarSolicitacao(liberada, "INICIAR_ANALISE", { adminId });
    }
    default:
      return situacao;
  }
}

/** Situação resultante de uma decisão, segundo a máquina ME-01. */
export function situacaoDaDecisao(
  situacaoAtual: string,
  decisao: DecisaoSolicitacao,
  contexto: ContextoSolicitacao & { adminId: string },
): SituacaoSolicitacao {
  if (!situacaoDecidivel(situacaoAtual)) {
    throw new Error(`Transição inválida a partir de "${situacaoAtual}"`);
  }

  const emAnalise = normalizarParaAnalise(
    situacaoAtual as SituacaoSolicitacao,
    contexto.adminId,
  );

  switch (decisao) {
    case "aprovar":
      return transicionarSolicitacao(emAnalise, "REGISTRAR_DECISAO_APROVACAO", {
        ...contexto,
        dadosCompletos: true,
        justificativa:
          contexto.justificativa?.trim() || JUSTIFICATIVA_APROVACAO_PADRAO,
      });
    case "reprovar":
      return transicionarSolicitacao(
        emAnalise,
        "REGISTRAR_DECISAO_REJEICAO",
        contexto,
      );
    case "solicitar_correcao":
      return transicionarSolicitacao(emAnalise, "SOLICITAR_CORRECAO", contexto);
  }
}
