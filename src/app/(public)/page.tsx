import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Building2,
  Coffee,
  Scissors,
  ShoppingBasket,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { buscarNegocios, listarCategoriasAtivas } from "@/application/catalogo";
import { Button } from "@/ui/components/button";
import { NegocioCard } from "./_components/negocio-card";
import { Carrossel } from "./_components/carrossel";
import { JsonLd } from "./_components/dados-estruturados";

export const revalidate = 60;

const urlSite = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://guiabg.com.br"
).replace(/\/+$/, "");

const DESCRICAO =
  "Guia comunitário de Bento Gonçalves: encontre padarias, restaurantes, oficinas, salões e serviços perto de você. Feito por quem vive na cidade.";

export const metadata: Metadata = {
  title: "Comércios e serviços de Bento Gonçalves",
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: {
    title: "GuiaBG — comércios e serviços de Bento Gonçalves",
    description: DESCRICAO,
    url: "/",
    type: "website",
    siteName: "GuiaBG",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuiaBG — comércios e serviços de Bento Gonçalves",
    description: DESCRICAO,
  },
};

/**
 * WebSite + Organization (schema.org) para a home. O SearchAction aponta para
 * a busca do catálogo, que é a rota indexável de resultados (a /busca é noindex).
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${urlSite}/#website`,
      url: urlSite,
      name: "GuiaBG",
      description: DESCRICAO,
      inLanguage: "pt-BR",
      publisher: { "@id": `${urlSite}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${urlSite}/catalogo?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${urlSite}/#organization`,
      name: "GuiaBG",
      url: urlSite,
      description:
        "Guia comunitário de comércios e serviços de Bento Gonçalves, feito pela comunidade.",
      logo: {
        "@type": "ImageObject",
        url: `${urlSite}/apple-icon.png`,
      },
      areaServed: {
        "@type": "City",
        name: "Bento Gonçalves",
        containedInPlace: { "@type": "State", name: "Rio Grande do Sul" },
      },
    },
  ],
};

/**
 * Home (§5.2) — herói editorial com o pontilhado aprovado, categorias,
 * "Achados", "Gente daqui", faixa vermelha de participação e lista final.
 * Sem métrica inventada, sem "verificado", sem promessa de melhoria do bairro.
 */

const ICONES_CATEGORIA: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  padarias: Coffee,
  "padarias-e-confeitarias": Coffee,
  restaurantes: UtensilsCrossed,
  pizzarias: UtensilsCrossed,
  cafeterias: Coffee,
  mercados: ShoppingBasket,
  "mercados-e-hortifruti": ShoppingBasket,
  beleza: Scissors,
  "salao-de-beleza": Scissors,
  saude: Stethoscope,
  "clinicas-e-saude": Stethoscope,
  automotivo: Wrench,
  "oficinas-e-automotivo": Wrench,
  servicos: Wrench,
};

function iconeDaCategoria(slug: string) {
  return ICONES_CATEGORIA[slug] ?? Store;
}

export default async function HomePage() {
  const [resultado, categorias] = await Promise.all([
    buscarNegocios({ porPagina: 12, ordenacao: "relevancia" }),
    listarCategoriasAtivas(),
  ]);

  const negocios = resultado.negocios ?? [];
  const categoriasAtivas = categorias ?? [];
  const achados = negocios.slice(0, 8);
  const destaque = negocios[0];
  const genteDaqui = negocios.slice(0, 3);
  const maisComercios = negocios.slice(3, 12);

  return (
    <div className="bg-canvas">
      <JsonLd dados={jsonLd} />

      {/* 1. Herói editorial */}
      <section className="relative overflow-hidden border-b border-line bg-surface hero-dots">
        <div className="container-page relative py-16 md:py-24">
          <p className="eyebrow">Guia comunitário de Bento Gonçalves</p>

          <h1 className="display mt-4 max-w-[16ch]">
            Consuma de quem{" "}
            <em className="not-italic text-brand">
              <span className="font-[family-name:var(--font-fraunces)] italic">
                muda a comunidade.
              </span>
            </em>
          </h1>

          <p className="mt-6 max-w-[46ch] text-lg text-ink-soft">
            E produza para mudar também. Comércios e serviços pertinho de você.
          </p>

          <form
            action="/catalogo"
            method="get"
            role="search"
            className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="busca-hero" className="sr-only">
              Buscar comércio ou serviço
            </label>
            <input
              id="busca-hero"
              name="q"
              type="search"
              placeholder="Padaria, oficina, dentista…"
              className="h-12 w-full rounded-[14px] border border-line-strong bg-canvas px-4 text-base text-ink placeholder:text-ink-mute focus-visible:border-brand"
            />
            <Button type="submit" size="lg" className="shrink-0">
              Buscar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          {categoriasAtivas.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {categoriasAtivas.slice(0, 6).map((categoria) => (
                <li key={categoria.id}>
                  <Link
                    href={`/catalogo?categoria=${categoria.slug}`}
                    className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
                  >
                    {categoria.nome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* 2. Categorias */}
      {categoriasAtivas.length > 0 ? (
        <section id="categorias" className="border-b border-line bg-canvas">
          <div className="container-page py-14 md:py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="h1-editorial text-[1.75rem]">
                Explore por categoria
              </h2>
              <Link
                href="/catalogo"
                className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
              >
                Ver catálogo completo
              </Link>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {categoriasAtivas.map((categoria) => {
                const Icone = iconeDaCategoria(categoria.slug);
                return (
                  <li key={categoria.id}>
                    <Link
                      href={`/catalogo?categoria=${categoria.slug}`}
                      className="flex h-full min-h-11 items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                    >
                      <Icone className="size-4 shrink-0 text-brand" />
                      <span className="truncate">{categoria.nome}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 3. Achados */}
      {achados.length > 0 ? (
        <section className="border-b border-line bg-surface">
          <div className="container-page py-14 md:py-16">
            <div className="mb-6 max-w-[52ch]">
              <h2 className="h1-editorial text-[1.75rem]">
                Do bairro, para o bairro.
              </h2>
              <p className="mt-2 text-ink-soft">
                Comércios e serviços publicados pela própria comunidade.
              </p>
            </div>

            <Carrossel rotulo="Comércios em destaque">
              {achados.map((negocio) => (
                <div key={negocio.id} className="w-[268px] sm:w-[300px]">
                  <NegocioCard negocio={negocio} />
                </div>
              ))}
            </Carrossel>
          </div>
        </section>
      ) : null}

      {/* 4. Gente daqui */}
      {destaque ? (
        <section className="border-b border-line bg-canvas">
          <div className="container-page grid gap-8 py-14 md:grid-cols-2 md:items-center md:py-16">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[22px] border border-line bg-brand-tint">
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand"
              >
                <Building2 className="size-10" />
                <span className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold">
                  {destaque.nome
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((parte) => parte[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-strong">
                  {destaque.categorias[0]?.nome ?? "Comércio local"}
                </span>
              </div>
            </div>

            <div>
              <p className="eyebrow">Gente daqui</p>
              <h2 className="h1-editorial mt-3 text-[1.75rem]">
                Quem faz a cidade acontecer
              </h2>
              <ol className="mt-6 divide-y divide-line border-y border-line">
                {genteDaqui.map((negocio, indice) => (
                  <li key={negocio.id}>
                    <Link
                      href={`/negocio/${negocio.slug}`}
                      className="flex items-baseline gap-4 py-4 transition-colors hover:text-brand"
                    >
                      <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-ink-mute tabular-nums">
                        {String(indice + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">
                        <span className="block text-base font-semibold text-ink">
                          {negocio.nome}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-soft">
                          {negocio.localizacao?.bairro ?? "Bento Gonçalves"}
                          {negocio.categorias[0]
                            ? ` · ${negocio.categorias[0].nome}`
                            : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. Faixa vermelha de participação */}
      <section className="bg-brand text-on-brand">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold md:text-3xl">
              Tem um comércio ou um serviço?
            </h2>
            <p className="mt-2 max-w-[52ch] text-on-brand/90">
              Coloque no guia. A gente confere e publica.
            </p>
            <p className="mt-1 text-sm font-semibold text-on-brand/80">
              Análise em até 24 h · resposta por e-mail
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-on-brand text-brand hover:bg-on-brand/90"
          >
            <Link href="/solicitar">Participar do guia</Link>
          </Button>
        </div>
      </section>

      {/* 6. Mais comércios */}
      <section className="bg-surface">
        <div className="container-page py-14 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="h1-editorial text-[1.75rem]">Mais comércios</h2>
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {maisComercios.length > 0 ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {maisComercios.map((negocio) => (
                <li key={negocio.id}>
                  <Link
                    href={`/negocio/${negocio.slug}`}
                    className="flex flex-col gap-1 py-4 transition-colors hover:text-brand sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-base font-semibold text-ink">
                      {negocio.nome}
                    </span>
                    <span className="text-sm text-ink-soft">
                      {negocio.categorias[0]?.nome ?? "Comércio"}
                      {negocio.localizacao?.bairro
                        ? ` · ${negocio.localizacao.bairro}`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 rounded-[22px] border border-dashed border-line bg-canvas px-6 py-14 text-center">
              <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-ink">
                O guia ainda está começando
              </h3>
              <p className="mx-auto mt-2 max-w-[46ch] text-ink-soft">
                Assim que os primeiros comércios forem publicados, eles aparecem
                aqui.
              </p>
              <Button asChild className="mt-6">
                <Link href="/solicitar">Cadastrar meu comércio</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
