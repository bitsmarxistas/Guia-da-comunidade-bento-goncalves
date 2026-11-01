/**
 * Regras de arquivo enviado pelo site público (fotos e anexos).
 *
 * Fica fora das rotas para poder ser testado sem servidor e para que a mesma
 * regra valha nos três pontos que precisam dela: a API que assina o upload, a
 * criação da solicitação (que confere a URL recebida) e o painel do admin.
 */

export type FinalidadeMidia = "imagem" | "anexo";

export const MIMES_IMAGEM = ["image/jpeg", "image/png", "image/webp"] as const;

export const MIMES_ANEXO = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** Guia (§5.5): até 4 fotos de 5 MB. */
export const MAX_FOTOS_POR_SOLICITACAO = 4;
/** Guia (§5.5): até 3 anexos de 10 MB. */
export const MAX_ANEXOS_POR_SOLICITACAO = 3;
export const LIMITE_IMAGEM_BYTES = 5 * 1024 * 1024;
export const LIMITE_ANEXO_BYTES = 10 * 1024 * 1024;

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const EXTENSOES_IMAGEM = ["jpg", "jpeg", "png", "webp"];
const EXTENSOES_ANEXO = ["pdf", "doc", "docx"];

/** Prefixos em que um upload público pode ser gravado. */
export const PREFIXO_SOLICITACAO_TEMP = "solicitacoes/temp";

export function extensaoDoMime(mimeType: string): string | null {
  return EXTENSOES[mimeType] ?? null;
}

export type ResultadoValidacaoUpload =
  { valido: true; extensao: string } | { valido: false; erro: string };

/**
 * Confere tipo e tamanho declarados antes de assinar a URL de upload.
 *
 * A assinatura carrega o tamanho exato, então um arquivo maior que o declarado
 * é recusado pelo próprio R2 — a checagem aqui existe para devolver uma frase
 * em português em vez de um 403 seco.
 */
export function validarUpload(
  finalidade: FinalidadeMidia,
  arquivo: { mimeType?: unknown; tamanhoBytes?: unknown },
): ResultadoValidacaoUpload {
  const mimeType = typeof arquivo.mimeType === "string" ? arquivo.mimeType : "";
  const tamanhoBytes =
    typeof arquivo.tamanhoBytes === "number" &&
    Number.isFinite(arquivo.tamanhoBytes)
      ? arquivo.tamanhoBytes
      : Number.NaN;

  const permitidos: readonly string[] =
    finalidade === "imagem" ? MIMES_IMAGEM : MIMES_ANEXO;
  const limite =
    finalidade === "imagem" ? LIMITE_IMAGEM_BYTES : LIMITE_ANEXO_BYTES;

  if (!permitidos.includes(mimeType)) {
    return {
      valido: false,
      erro:
        finalidade === "imagem"
          ? "Formato não aceito. Envie JPG, PNG ou WebP."
          : "Formato não aceito. Envie PDF, DOC ou DOCX.",
    };
  }

  if (!Number.isFinite(tamanhoBytes) || tamanhoBytes <= 0) {
    return { valido: false, erro: "O arquivo está vazio ou ilegível." };
  }

  if (tamanhoBytes > limite) {
    return {
      valido: false,
      erro: `O arquivo passa de ${Math.round(limite / (1024 * 1024))} MB. Reduza e envie de novo.`,
    };
  }

  const extensao = extensaoDoMime(mimeType);
  if (!extensao) {
    return { valido: false, erro: "Formato não aceito." };
  }

  return { valido: true, extensao };
}

/** Nome da chave no bucket: <prefixo>/<minúsculo>-<aleatório>.<ext>. */
export function gerarChaveArmazenamento(
  prefixo: string,
  extensao: string,
  aleatorio: string = crypto.randomUUID().replace(/-/g, "").slice(0, 10),
): string {
  const marca = Date.now().toString(36);
  const sufixo = aleatorio.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${prefixo}/${marca}-${sufixo}.${extensao}`;
}

/**
 * Chave aceitável vinda do navegador.
 *
 * Sem isso, o formulário de solicitação aceitaria qualquer URL — inclusive de
 * outro site — e a ficha publicada exibiria uma imagem que não é nossa.
 */
export function chaveValida(
  chave: unknown,
  opcoes: { prefixos: string[]; finalidade: FinalidadeMidia },
): boolean {
  if (typeof chave !== "string" || chave.length === 0 || chave.length > 160) {
    return false;
  }
  if (chave.startsWith("/") || chave.includes("..") || chave.includes("//")) {
    return false;
  }
  if (!opcoes.prefixos.some((prefixo) => chave.startsWith(`${prefixo}/`))) {
    return false;
  }
  const extensao = chave.split(".").pop()?.toLowerCase() ?? "";
  const permitidas =
    opcoes.finalidade === "imagem" ? EXTENSOES_IMAGEM : EXTENSOES_ANEXO;
  return permitidas.includes(extensao);
}

/** Extrai a chave de uma URL pública do bucket. `null` se a URL não for nossa. */
export function chaveDoUrlPublico(
  url: unknown,
  basePublica: string | undefined,
): string | null {
  if (typeof url !== "string" || !basePublica) return null;
  const base = basePublica.replace(/\/+$/, "");
  const normalizada = url.trim();
  if (!normalizada.startsWith(`${base}/`)) return null;
  const chave = normalizada.slice(base.length + 1).split("?")[0] ?? "";
  return chave.length > 0 ? decodeURIComponent(chave) : null;
}

export interface MidiaEnviada {
  key: string;
  url: string;
  tipo?: "logo" | "foto";
  nomeOriginal?: string;
  mimeType?: string;
  tamanhoBytes?: number;
}

export type ResultadoMidias =
  { ok: true; midias: MidiaEnviada[] } | { ok: false; erro: string };

/**
 * Confere a lista que o navegador devolve no formulário.
 *
 * Cada item precisa ser uma URL do nosso bucket, com chave dentro do prefixo de
 * upload público — o formulário é público e não pode virar porta para publicar
 * imagem de outro domínio na ficha do comércio.
 */
export function normalizarMidiasEnviadas(
  bruto: unknown,
  opcoes: {
    finalidade: FinalidadeMidia;
    maximo: number;
    basePublica: string;
    prefixos?: string[];
  },
): ResultadoMidias {
  if (bruto === undefined || bruto === null || bruto === "") {
    return { ok: true, midias: [] };
  }

  let lista: unknown = bruto;
  if (typeof bruto === "string") {
    try {
      lista = JSON.parse(bruto);
    } catch {
      return { ok: false, erro: "Não foi possível ler os arquivos enviados." };
    }
  }

  if (!Array.isArray(lista)) {
    return { ok: false, erro: "Lista de arquivos inválida." };
  }

  const base = opcoes.basePublica.replace(/\/+$/, "");
  const prefixos =
    opcoes.prefixos ??
    (opcoes.finalidade === "anexo"
      ? [`${PREFIXO_SOLICITACAO_TEMP}/anexos`]
      : [PREFIXO_SOLICITACAO_TEMP]);

  const vistos = new Set<string>();
  const midias: MidiaEnviada[] = [];

  for (const item of lista) {
    if (midias.length >= opcoes.maximo) break;
    if (!item || typeof item !== "object") continue;

    const registro = item as Record<string, unknown>;
    const chave =
      typeof registro.key === "string"
        ? registro.key
        : chaveDoUrlPublico(registro.url, base);

    if (
      !chave ||
      vistos.has(chave) ||
      !chaveValida(chave, { prefixos, finalidade: opcoes.finalidade })
    ) {
      continue;
    }

    const url =
      typeof registro.url === "string" && registro.url.startsWith(`${base}/`)
        ? registro.url
        : `${base}/${chave}`;

    if (!url) continue;

    vistos.add(chave);

    const tipo =
      opcoes.finalidade === "imagem"
        ? registro.tipo === "logo"
          ? "logo"
          : "foto"
        : undefined;

    const nomeOriginal =
      typeof registro.fileName === "string"
        ? registro.fileName
        : typeof registro.nomeOriginal === "string"
          ? registro.nomeOriginal
          : undefined;

    const mimeType =
      typeof registro.fileType === "string"
        ? registro.fileType
        : typeof registro.mimeType === "string"
          ? registro.mimeType
          : undefined;

    const tamanhoBytes =
      typeof registro.fileSize === "number" && registro.fileSize > 0
        ? registro.fileSize
        : typeof registro.tamanhoBytes === "number" && registro.tamanhoBytes > 0
          ? registro.tamanhoBytes
          : undefined;

    midias.push({
      key: chave,
      url,
      ...(tipo ? { tipo } : {}),
      ...(nomeOriginal ? { nomeOriginal } : {}),
      ...(mimeType ? { mimeType } : {}),
      ...(tamanhoBytes ? { tamanhoBytes } : {}),
    });
  }

  return { ok: true, midias };
}
