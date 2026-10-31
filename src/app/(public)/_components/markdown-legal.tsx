// src/app/(public)/_components/markdown-legal.tsx
import { Fragment, type ReactNode } from "react";

/**
 * Renderizador mínimo de Markdown para os documentos legais publicados no
 * banco. Cobre apenas o que os textos usam: títulos "##" e "###", listas com
 * "- " ou "1. ", parágrafos separados por linha em branco e ênfase "**".
 *
 * Segurança: nada de HTML injetado e nada de HTML cru. Todo texto é
 * devolvido como nó React (portanto escapado); os únicos atributos dinâmicos
 * são ids de âncora gerados a partir do próprio título.
 */

type NivelTitulo = 2 | 3 | 4 | 5;

type Bloco =
  | { tipo: "titulo"; nivel: NivelTitulo; texto: string; id: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; ordenada: boolean; itens: string[] };

export interface SecaoSumario {
  id: string;
  texto: string;
}

const REGEX_TITULO = /^(#{1,4})\s+(.+?)\s*#*$/;
const REGEX_ITEM_NAO_ORDENADO = /^[-*]\s+(.+)$/;
const REGEX_ITEM_ORDENADO = /^\d+[.)]\s+(.+)$/;

const TAGS_TITULO = {
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
} as const;

function ehLinhaEspecial(linha: string): boolean {
  return (
    REGEX_TITULO.test(linha) ||
    REGEX_ITEM_NAO_ORDENADO.test(linha) ||
    REGEX_ITEM_ORDENADO.test(linha)
  );
}

/** Slug estável para âncora: sem acento, minúsculo e com hífens. */
function gerarId(texto: string, prefixo: string, usados: Set<string>): string {
  const slug = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const base = [prefixo, slug || "secao"].filter(Boolean).join("-");
  let id = base;
  let sufixo = 2;

  while (usados.has(id)) {
    id = `${base}-${sufixo}`;
    sufixo += 1;
  }

  usados.add(id);
  return id;
}

function analisar(
  conteudo: string,
  prefixo: string,
  nivelBase: 2 | 3,
): { blocos: Bloco[]; secoes: SecaoSumario[] } {
  const linhas = conteudo.replace(/\r\n?/g, "\n").split("\n");
  const blocos: Bloco[] = [];
  const secoes: SecaoSumario[] = [];
  const usados = new Set<string>();
  let indice = 0;

  while (indice < linhas.length) {
    const linha = (linhas[indice] ?? "").trim();

    if (linha === "") {
      indice += 1;
      continue;
    }

    const titulo = REGEX_TITULO.exec(linha);

    if (titulo) {
      const marca = titulo[1] ?? "";
      const texto = (titulo[2] ?? "").trim();
      const deslocamento = marca.length === 3 ? 1 : marca.length >= 4 ? 2 : 0;
      const nivel = Math.min(nivelBase + deslocamento, 5) as NivelTitulo;
      const id = gerarId(texto, prefixo, usados);

      blocos.push({ tipo: "titulo", nivel, texto, id });

      if (deslocamento === 0) {
        secoes.push({ id, texto });
      }

      indice += 1;
      continue;
    }

    const itemNaoOrdenado = REGEX_ITEM_NAO_ORDENADO.exec(linha);
    const itemOrdenado = REGEX_ITEM_ORDENADO.exec(linha);

    if (itemNaoOrdenado || itemOrdenado) {
      const ordenada = itemOrdenado !== null;
      const regexItem = ordenada
        ? REGEX_ITEM_ORDENADO
        : REGEX_ITEM_NAO_ORDENADO;
      const itens: string[] = [];

      while (indice < linhas.length) {
        const atual = (linhas[indice] ?? "").trim();
        const casou = regexItem.exec(atual);

        if (!casou) break;

        itens.push((casou[1] ?? "").trim());
        indice += 1;
      }

      blocos.push({ tipo: "lista", ordenada, itens });
      continue;
    }

    const paragrafo: string[] = [];

    while (indice < linhas.length) {
      const atual = (linhas[indice] ?? "").trim();

      if (atual === "" || ehLinhaEspecial(atual)) break;

      paragrafo.push(atual);
      indice += 1;
    }

    blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ") });
  }

  return { blocos, secoes };
}

/** Converte "**texto**" em <strong>, mantendo o restante como texto puro. */
function renderizarInline(texto: string): ReactNode {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);

  return partes.map((parte, indice) => {
    const negrito = /^\*\*([^*]+)\*\*$/.exec(parte);
    const marcado = negrito ? negrito[1] : undefined;

    if (marcado) {
      return (
        <strong key={indice} className="font-semibold text-ink">
          {marcado}
        </strong>
      );
    }

    return <Fragment key={indice}>{parte}</Fragment>;
  });
}

function BlocoConteudo({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === "titulo") {
    const Tag = TAGS_TITULO[bloco.nivel];
    const classes =
      bloco.nivel === 2
        ? "mt-10 scroll-mt-24 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink first:mt-0 md:text-3xl"
        : bloco.nivel === 3
          ? "mt-8 scroll-mt-24 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink first:mt-0"
          : bloco.nivel === 4
            ? "mt-6 scroll-mt-24 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-ink first:mt-0"
            : "mt-5 scroll-mt-24 font-[family-name:var(--font-fraunces)] text-base font-semibold text-ink first:mt-0";

    return (
      <Tag id={bloco.id} className={classes}>
        {renderizarInline(bloco.texto)}
      </Tag>
    );
  }

  if (bloco.tipo === "lista") {
    const classes =
      "mt-4 space-y-2 pl-5 text-ink-soft marker:text-brand first:mt-0";

    if (bloco.ordenada) {
      return (
        <ol className={`${classes} list-decimal`}>
          {bloco.itens.map((item, indice) => (
            <li key={indice} className="pl-1 leading-relaxed">
              {renderizarInline(item)}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <ul className={`${classes} list-disc`}>
        {bloco.itens.map((item, indice) => (
          <li key={indice} className="pl-1 leading-relaxed">
            {renderizarInline(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-4 text-ink-soft first:mt-0">
      {renderizarInline(bloco.texto)}
    </p>
  );
}

export function MarkdownLegal({
  conteudo,
  idPrefixo = "documento",
  nivelBase = 2,
}: {
  conteudo: string;
  idPrefixo?: string;
  /** Nível do primeiro título. Use 3 quando o documento já tem um h2 acima. */
  nivelBase?: 2 | 3;
}) {
  const { blocos, secoes } = analisar(conteudo, idPrefixo, nivelBase);
  const idSumario = `${idPrefixo}-sumario`;
  const exibirSumario = secoes.length >= 4;

  return (
    <div>
      {exibirSumario ? (
        <nav
          aria-labelledby={idSumario}
          className="mt-6 rounded-[22px] border border-line bg-surface-2 p-5"
        >
          <p id={idSumario} className="eyebrow">
            Neste documento
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {secoes.map((secao) => (
              <li key={secao.id}>
                <a
                  href={`#${secao.id}`}
                  className="block rounded-sm py-0.5 text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-brand"
                >
                  {secao.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-8 text-[0.95rem] leading-relaxed">
        {blocos.map((bloco, indice) => (
          <BlocoConteudo key={indice} bloco={bloco} />
        ))}
      </div>
    </div>
  );
}
