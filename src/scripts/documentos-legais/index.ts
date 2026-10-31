// src/scripts/documentos-legais/index.ts
import { POLITICA_PRIVACIDADE } from "./politica-privacidade";
import { TERMOS_USO } from "./termos-uso";
import { TRATAMENTO_DADOS } from "./tratamento-dados";

/** Tipos aceitos pela coluna `documento_termo.tipo` (varchar 30). */
export type TipoDocumentoLegal =
  "termos_uso" | "politica_privacidade" | "tratamento_dados";

export interface DocumentoLegalPublicavel {
  tipo: TipoDocumentoLegal;
  versao: string;
  titulo: string;
  conteudo: string;
}

/** Versão publicada por `pnpm db:seed:legais`. */
export const VERSAO_DOCUMENTOS_LEGAIS = "2.0";

/**
 * Fonte única dos textos legais. A ordem é a de exibição quando uma página
 * reúne mais de um tipo (por exemplo, /privacidade).
 */
export const DOCUMENTOS_LEGAIS: DocumentoLegalPublicavel[] = [
  {
    tipo: "termos_uso",
    versao: VERSAO_DOCUMENTOS_LEGAIS,
    titulo: "Termos de uso",
    conteudo: TERMOS_USO,
  },
  {
    tipo: "politica_privacidade",
    versao: VERSAO_DOCUMENTOS_LEGAIS,
    titulo: "Política de privacidade",
    conteudo: POLITICA_PRIVACIDADE,
  },
  {
    tipo: "tratamento_dados",
    versao: VERSAO_DOCUMENTOS_LEGAIS,
    titulo: "Tratamento de dados pessoais",
    conteudo: TRATAMENTO_DADOS,
  },
];
