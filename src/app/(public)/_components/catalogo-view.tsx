import Link from "next/link";
import { Building2, X } from "lucide-react";
import {
  buscarNegocios,
  listarCategoriasAtivas,
  listarBairrosComNegocios,
} from "@/application/catalogo";
import { NegocioCard } from "./negocio-card";
import { FiltrosPainel } from "./filtros-painel";
import { Button } from "@/ui/components/button";

type SearchParams = Record<string, string | string[] | undefined>;

type Ordenacao = "relevancia" | "nome_asc" | "nome_desc" | "atualizado_desc";

const ORDENACOES: Array<{ valor: Ordenacao; rotulo: string }> = [
  { valor: "relevancia", rotulo: "Mais relevantes" },
  { valor: "atualizado_desc", rotulo: "Atualizados recentemente" },
  { valor: "nome_asc", rotulo: "Nome (A-Z)" },
  { valor: "nome_desc", rotulo: "Nome (Z-A)" },
];

const POR_PAGINA = 9;

function toArray(valor: string | string[] | undefined): string[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function primeiro(valor: string | string[] | undefined): string {
  return toArray(valor)[0] ?? "";
}

function parsePagina(valor: string | string[] | undefined): number {
  const numero = Number(primeiro(valor));
  return Number.isInteger(numero) && numero > 0 ? numero : 1;
}

function parseOrdenacao(valor: string | string[] | undefined): Ordenacao {
  const bruto = primeiro(valor);
  return ORDENACOES.some((o) => o.valor === bruto)
    ? (bruto as Ordenacao)
    : "relevancia";
}

function montarUrl(
  basePath: string,
  params: SearchParams,
  opcoes: {
    remover?: string[];
    removerValor?: [string, string];
    pagina?: number;
  } = {},
): string {
  const search = new URLSearchParams();

  for (const [chave, valor] of Object.entries(params)) {
    if (chave === "pagina") continue;
    if (opcoes.remover?.includes(chave)) continue;

    for (const item of toArray(valor)) {
      if (!item) continue;
      if (
        opcoes.removerValor &&
        opcoes.removerValor[0] === chave &&
        opcoes.removerValor[1] === item
      ) {
        continue;
      }
      search.append(chave, item);
    }
  }

  if (opcoes.pagina && opcoes.pagina > 1) {
    search.set("pagina", String(opcoes.pagina));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export interface CatalogoViewProps {
  basePath: string;
  searchParams: SearchParams;
  titulo: string;
  descricao: string;
}

export async function CatalogoView({
  basePath,
  searchParams,
  titulo,
  descricao,
}: CatalogoViewProps) {
  const termo = primeiro(searchParams.q).trim();
  const categoriasSelecionadas = toArray(searchParams.categoria).filter(
    Boolean,
  );
  const bairrosSelecionados = toArray(searchParams.bairro).filter(Boolean);
  const ordenacao = parseOrdenacao(searchParams.ordem);
  const pagina = parsePagina(searchParams.pagina);
  const somenteAbertos = primeiro(searchParams.aberto) === "1";

  const [categorias, bairros] = await Promise.all([
    // No catálogo a categoria oculta continua disponível como filtro.
    listarCategoriasAtivas({ incluirOcultas: true }),
    listarBairrosComNegocios(),
  ]);

  /*
   * Categorias "ocultas" continuam no filtro, mas recolhidas: a lista principal
   * fica curta e o visitante expande quando quer — sem perder nenhuma opção.
   */
  const categoriasPrincipais = categorias.filter((c) => !c.oculta);
  const categoriasOcultas = categorias.filter((c) => c.oculta);

  const idsPorSlug = new Map(categorias.map((c) => [c.slug, c.id]));
  const nomesPorSlug = new Map(categorias.map((c) => [c.slug, c.nome]));
  const categoriasIds = categoriasSelecionadas
    .map((slug) => idsPorSlug.get(slug))
    .filter((id): id is string => Boolean(id));

  const resultado = await buscarNegocios({
    q: termo || undefined,
    categoriasIds,
    bairros: bairrosSelecionados,
    pagina,
    porPagina: POR_PAGINA,
    ordenacao,
    abertoAgora: somenteAbertos,
  });

  const { negocios, paginacao } = resultado;
  const filtrosAtivos =
    (termo ? 1 : 0) +
    categoriasSelecionadas.length +
    bairrosSelecionados.length +
    (ordenacao !== "relevancia" ? 1 : 0) +
    (somenteAbertos ? 1 : 0);
  const temFiltros = filtrosAtivos > 0;

  return (
    <div className="bg-canvas">
      <div className="container-page py-10 md:py-12">
        <nav aria-label="Você está aqui" className="text-sm text-ink-mute">
          <Link href="/" className="hover:text-brand">
            Início
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-ink">{titulo}</span>
        </nav>

        <header className="mt-4 max-w-[62ch]">
          <h1 className="h1-editorial">{titulo}</h1>
          <p className="mt-3 text-ink-soft">{descricao}</p>
        </header>

        {/* Chips de filtros ativos */}
        {temFiltros ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {termo ? (
              <Chip
                ativo
                href={montarUrl(basePath, searchParams, { remover: ["q"] })}
              >
                Busca: {termo}
              </Chip>
            ) : null}
            {categoriasSelecionadas.map((slug) => (
              <Chip
                key={slug}
                ativo
                href={montarUrl(basePath, searchParams, {
                  removerValor: ["categoria", slug],
                })}
              >
                {nomesPorSlug.get(slug) ?? slug}
              </Chip>
            ))}
            {bairrosSelecionados.map((bairro) => (
              <Chip
                key={bairro}
                ativo
                href={montarUrl(basePath, searchParams, {
                  removerValor: ["bairro", bairro],
                })}
              >
                {bairro}
              </Chip>
            ))}
            {somenteAbertos ? (
              <Chip
                ativo
                href={montarUrl(basePath, searchParams, {
                  remover: ["aberto"],
                })}
              >
                Aberto agora
              </Chip>
            ) : null}
            {ordenacao !== "relevancia" ? (
              <Chip
                ativo
                href={montarUrl(basePath, searchParams, { remover: ["ordem"] })}
              >
                {ORDENACOES.find((o) => o.valor === ordenacao)?.rotulo}
              </Chip>
            ) : null}

            <Link
              href={basePath}
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Limpar filtros
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 md:grid-cols-[264px_1fr] md:gap-10">
          <FiltrosPainel ativos={filtrosAtivos}>
            <form method="get" action={basePath} className="space-y-6">
              <div>
                <label
                  htmlFor="filtro-busca"
                  className="mb-2 block text-[13px] font-semibold text-ink"
                >
                  Buscar
                </label>
                <input
                  id="filtro-busca"
                  name="q"
                  type="search"
                  defaultValue={termo}
                  placeholder="Nome ou serviço"
                  className="h-11 w-full rounded-[14px] border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-mute focus-visible:border-brand"
                />
              </div>

              <label
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold text-ink"
                htmlFor="filtro-aberto"
              >
                <input
                  id="filtro-aberto"
                  type="checkbox"
                  name="aberto"
                  value="1"
                  defaultChecked={somenteAbertos}
                  className="size-4 accent-[var(--brand)]"
                />
                Aberto agora
              </label>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-ink">
                  Categoria
                </legend>
                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {categoriasPrincipais.map((categoria) => (
                    <label
                      key={categoria.id}
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-[8px] px-1 text-sm text-ink-soft hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        name="categoria"
                        value={categoria.slug}
                        defaultChecked={categoriasSelecionadas.includes(
                          categoria.slug,
                        )}
                        className="size-4 accent-[var(--brand)]"
                      />
                      {categoria.nome}
                    </label>
                  ))}

                  {categoriasOcultas.length > 0 ? (
                    <details className="pt-1">
                      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-[8px] px-1 text-[13px] font-semibold text-brand hover:underline">
                        + {categoriasOcultas.length} categorias
                      </summary>
                      <div className="space-y-1 pt-1">
                        {categoriasOcultas.map((categoria) => (
                          <label
                            key={categoria.id}
                            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-[8px] px-1 text-sm text-ink-soft hover:text-ink"
                          >
                            <input
                              type="checkbox"
                              name="categoria"
                              value={categoria.slug}
                              defaultChecked={categoriasSelecionadas.includes(
                                categoria.slug,
                              )}
                              className="size-4 accent-[var(--brand)]"
                            />
                            {categoria.nome}
                          </label>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-ink">
                  Bairro
                </legend>
                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {bairros.map((bairro) => (
                    <label
                      key={bairro.bairro}
                      className="flex min-h-9 cursor-pointer items-center gap-2 rounded-[8px] px-1 text-sm text-ink-soft hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        name="bairro"
                        value={bairro.bairro}
                        defaultChecked={bairrosSelecionados.includes(
                          bairro.bairro,
                        )}
                        className="size-4 accent-[var(--brand)]"
                      />
                      <span className="flex-1">{bairro.bairro}</span>
                      <span className="text-xs text-ink-mute tabular">
                        {bairro.total}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="filtro-ordem"
                  className="mb-2 block text-[13px] font-semibold text-ink"
                >
                  Ordenar por
                </label>
                <select
                  id="filtro-ordem"
                  name="ordem"
                  defaultValue={ordenacao}
                  className="h-11 w-full rounded-[14px] border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  {ORDENACOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Aplicar filtros
                </Button>
                <Button asChild variant="outline">
                  <Link href={basePath}>Limpar</Link>
                </Button>
              </div>
            </form>
          </FiltrosPainel>

          <section aria-label="Resultados">
            <p className="text-sm text-ink-soft" role="status">
              <strong className="text-ink tabular">{paginacao.total}</strong>{" "}
              {paginacao.total === 1
                ? "comércio encontrado"
                : "comércios encontrados"}
              {paginacao.totalPaginas > 1
                ? ` · página ${paginacao.pagina} de ${paginacao.totalPaginas}`
                : ""}
            </p>

            {negocios.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {negocios.map((negocio, indice) => (
                  <NegocioCard
                    key={negocio.id}
                    negocio={negocio}
                    prioridade={indice === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-dashed border-line bg-surface px-6 py-16 text-center">
                <Building2
                  className="mx-auto size-10 text-ink-mute"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
                  {temFiltros
                    ? "Nenhum comércio com esses filtros"
                    : "O catálogo ainda está começando"}
                </h2>
                <p className="mx-auto mt-2 max-w-[46ch] text-ink-soft">
                  {temFiltros
                    ? "Tente outra busca, remova algum filtro ou veja todas as categorias."
                    : "Assim que os primeiros comércios forem publicados, eles aparecem aqui."}
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  {temFiltros ? (
                    <Button asChild variant="outline">
                      <Link href={basePath}>Limpar filtros</Link>
                    </Button>
                  ) : null}
                  <Button asChild>
                    <Link href="/solicitar">Participar</Link>
                  </Button>
                </div>
              </div>
            )}

            {paginacao.totalPaginas > 1 ? (
              <nav
                aria-label="Paginação"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {paginacao.pagina > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={montarUrl(basePath, searchParams, {
                        pagina: paginacao.pagina - 1,
                      })}
                    >
                      Anterior
                    </Link>
                  </Button>
                ) : null}

                <span className="text-sm text-ink-soft tabular">
                  {paginacao.pagina} / {paginacao.totalPaginas}
                </span>

                {paginacao.pagina < paginacao.totalPaginas ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={montarUrl(basePath, searchParams, {
                        pagina: paginacao.pagina + 1,
                      })}
                    >
                      Próxima
                    </Link>
                  </Button>
                ) : null}
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Chip({
  href,
  children,
  ativo = false,
}: {
  href: string;
  children: React.ReactNode;
  ativo?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
        ativo
          ? "border-brand bg-brand text-on-brand hover:bg-brand-strong"
          : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand",
      ].join(" ")}
      aria-label={`Remover filtro ${typeof children === "string" ? children : ""}`}
    >
      {children}
      <X className="size-3.5" aria-hidden="true" />
    </Link>
  );
}
