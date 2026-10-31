import { FileText } from "lucide-react";
import {
  listarTermosVigentes,
  type TipoTermo,
} from "@/application/termos/publicos";
import { MarkdownLegal } from "@/app/(public)/_components/markdown-legal";

const ROTULOS: Record<string, string> = {
  termos_uso: "Termos de uso",
  politica_privacidade: "Política de privacidade",
  tratamento_dados: "Tratamento de dados pessoais",
};

function rotuloDocumento(tipo: string): string {
  return ROTULOS[tipo] ?? tipo.replace(/_/g, " ");
}

/**
 * Renderiza documentos legais vigentes. Sem texto publicado mostra estado vazio
 * honesto em vez de conteúdo inventado.
 *
 * O conteúdo vem do banco em Markdown simples e é convertido em nós React por
 * `MarkdownLegal` (sem HTML injetado). Cada documento é um
 * `<article>` identificado pelo próprio título, e os títulos internos começam
 * em h3 para manter a hierarquia abaixo do h2 do documento.
 */
export async function DocumentoLegal({
  tipos,
  titulo,
  descricao,
}: {
  tipos: TipoTermo[];
  titulo: string;
  descricao: string;
}) {
  const documentos = await listarTermosVigentes(tipos);

  // A consulta ordena por data de publicação; aqui preservamos a ordem em que
  // os tipos foram pedidos pela página (ex.: política antes do ROPA).
  const ordenados = [...documentos].sort(
    (a, b) =>
      tipos.findIndex((tipo) => tipo === a.tipo) -
      tipos.findIndex((tipo) => tipo === b.tipo),
  );

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-3xl py-10 md:py-14">
        <p className="eyebrow">Documentos</p>
        <h1 className="h1-editorial mt-3">{titulo}</h1>
        <p className="mt-3 text-ink-soft">{descricao}</p>

        {ordenados.length === 0 ? (
          <div className="mt-8 rounded-[22px] border border-dashed border-line bg-surface px-6 py-12 text-center">
            <FileText
              className="mx-auto size-8 text-ink-mute"
              aria-hidden="true"
            />
            <p className="mt-3 text-ink-soft">
              Nenhum documento publicado ainda. Fale com a administração do
              guia.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {ordenados.map((documento, indice) => {
              const idTitulo = `documento-${indice + 1}-titulo`;

              return (
                <article
                  key={documento.id}
                  aria-labelledby={idTitulo}
                  className="rounded-[22px] border border-line bg-surface p-6 md:p-8"
                >
                  <header className="border-b border-line pb-5">
                    <h2
                      id={idTitulo}
                      className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-ink md:text-3xl"
                    >
                      {rotuloDocumento(documento.tipo)}
                    </h2>
                    <p className="mt-2 text-xs text-ink-mute">
                      Versão {documento.versao} · publicada em{" "}
                      <time dateTime={documento.publicadoEm.toISOString()}>
                        {documento.publicadoEm.toLocaleDateString("pt-BR")}
                      </time>
                    </p>
                  </header>

                  <MarkdownLegal
                    conteudo={documento.conteudo}
                    idPrefixo={`${documento.tipo}-${indice + 1}`}
                    nivelBase={3}
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
