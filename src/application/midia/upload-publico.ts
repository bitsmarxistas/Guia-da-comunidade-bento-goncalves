// src/application/midia/upload-publico.ts
import { env } from "@/shared/env";
import {
  gerarChaveArmazenamento,
  MAX_ANEXOS_POR_SOLICITACAO,
  MAX_FOTOS_POR_SOLICITACAO,
  normalizarMidiasEnviadas as normalizarMidias,
  PREFIXO_SOLICITACAO_TEMP,
  validarUpload,
  type FinalidadeMidia,
  type ResultadoMidias,
} from "@/domain/midia/arquivo";
import { assinarUpload, urlPublicaDaChave } from "@/infrastructure/r2/client";

/*
 * Upload do site: o navegador pede uma URL assinada, grava o arquivo direto no
 * R2 e depois manda só a chave junto com a solicitação.
 *
 * O arquivo nunca passa pelo servidor da Vercel (limite de 4,5 MB por request) e
 * o servidor não precisa confiar no tamanho informado: a assinatura carrega o
 * tamanho exato e o R2 recusa qualquer outro.
 */

export interface PedidoUploadMidia {
  finalidade: FinalidadeMidia;
  mimeType: unknown;
  tamanhoBytes: unknown;
  /** Presente quando o admin anexa uma foto a um comércio que já existe. */
  negocioId?: string | null;
}

export type ResultadoUploadMidia =
  | {
      ok: true;
      uploadUrl: string;
      key: string;
      url: string;
      expiresIn: number;
    }
  | { ok: false; erro: string };

export async function criarUploadAssinado(
  pedido: PedidoUploadMidia,
): Promise<ResultadoUploadMidia> {
  const validacao = validarUpload(pedido.finalidade, {
    mimeType: pedido.mimeType,
    tamanhoBytes: pedido.tamanhoBytes,
  });

  if (!validacao.valido) {
    return { ok: false, erro: validacao.erro };
  }

  const prefixo =
    pedido.finalidade === "anexo"
      ? `${PREFIXO_SOLICITACAO_TEMP}/anexos`
      : pedido.negocioId
        ? `negocios/${pedido.negocioId}`
        : PREFIXO_SOLICITACAO_TEMP;

  const mimeType = String(pedido.mimeType);
  const tamanhoBytes = Number(pedido.tamanhoBytes);
  const chave = gerarChaveArmazenamento(prefixo, validacao.extensao);

  // Sem `R2_PUBLIC_URL` a URL pública sai vazia e a foto nunca apareceria no
  // site: melhor recusar o envio do que gravar um registro quebrado.
  if (!urlPublicaDaChave(chave)) {
    console.error("[Upload] R2_PUBLIC_URL não configurada.");
    return {
      ok: false,
      erro: "O envio de imagens está indisponível no momento. Tente mais tarde.",
    };
  }

  try {
    const assinatura = await assinarUpload(chave, mimeType, tamanhoBytes);
    return {
      ok: true,
      uploadUrl: assinatura.uploadUrl,
      key: assinatura.key,
      url: assinatura.publicUrl || urlPublicaDaChave(chave),
      expiresIn: assinatura.expiresIn,
    };
  } catch (erro) {
    console.error("[Upload] Falha ao assinar URL:", erro);
    return {
      ok: false,
      erro: "Não foi possível preparar o envio da imagem. Tente de novo.",
    };
  }
}

/**
 * Versão de produção de `normalizarMidiasEnviadas`: usa a URL pública do bucket
 * configurada no ambiente. A regra em si (prefixo, extensão, quantidade) é do
 * domínio e não depende de env.
 */
export function normalizarMidiasEnviadas(
  bruto: unknown,
  opcoes: { finalidade: FinalidadeMidia; maximo: number },
): ResultadoMidias {
  const basePublica = env.R2_PUBLIC_URL ?? "";
  const temItens =
    bruto !== undefined &&
    bruto !== null &&
    bruto !== "" &&
    bruto !== "[]" &&
    !(Array.isArray(bruto) && bruto.length === 0);

  if (!basePublica && temItens) {
    return {
      ok: false,
      erro: "O envio de arquivos está indisponível no momento. Tente mais tarde.",
    };
  }

  return normalizarMidias(bruto, { ...opcoes, basePublica });
}

export const LIMITE_FOTOS = MAX_FOTOS_POR_SOLICITACAO;
export const LIMITE_ANEXOS = MAX_ANEXOS_POR_SOLICITACAO;
