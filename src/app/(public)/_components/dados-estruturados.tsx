type DadosEstruturados =
  Record<string, unknown> | Array<Record<string, unknown>>;

/**
 * Serialização segura de JSON-LD: o conteúdo vem de dados editáveis pelo
 * solicitante (nome, descrição), então "<" é escapado para impedir que um
 * "</script>" feche a tag antes da hora.
 */
function serializar(dados: DadosEstruturados): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

export function JsonLd({ dados }: { dados: DadosEstruturados }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializar(dados) }}
    />
  );
}
