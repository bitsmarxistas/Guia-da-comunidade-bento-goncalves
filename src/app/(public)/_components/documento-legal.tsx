import { FileText } from "lucide-react";
import {
  listarTermosVigentes,
  type TipoTermo,
} from "@/application/termos/publicos";

/**
 * Renderiza documentos legais vigentes. Sem texto publicado mostra estado vazio
 * honesto em vez de conteúdo inventado.
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

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-3xl py-10 md:py-14">
        <p className="eyebrow">Documentos</p>
        <h1 className="h1-editorial mt-3">{titulo}</h1>
        <p className="mt-3 text-ink-soft">{descricao}</p>

        {documentos.length === 0 ? (
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
          <div className="mt-8 space-y-6">
            {documentos.map((documento) => (
              <article
                key={documento.id}
                className="rounded-[22px] border border-line bg-surface p-6"
              >
                <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                  {documento.tipo.replace(/_/g, " ")}
                </h2>
                <p className="mt-1 text-xs text-ink-mute">
                  Versão {documento.versao} · publicada em{" "}
                  <time dateTime={documento.publicadoEm.toISOString()}>
                    {documento.publicadoEm.toLocaleDateString("pt-BR")}
                  </time>
                </p>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {documento.conteudo}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
