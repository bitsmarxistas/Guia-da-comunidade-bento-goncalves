/**
 * Esqueleto de carregamento (§4/§5.7).
 *
 * Fica na rota específica, e não em `(public)/loading.tsx`: um loading no topo
 * do grupo cria uma fronteira de Suspense em volta de TODAS as páginas, o shell
 * é enviado com status 200 antes da página resolver e o `notFound()` da ficha
 * de comércio deixa de responder 404 (soft 404). Aqui não existe notFound, dá
 * para ter o esqueleto sem custo de SEO.
 */

export default function CarregandoPublico() {
  return (
    <div className="bg-canvas" aria-busy="true" aria-live="polite">
      <div className="container-page py-12 md:py-16">
        <span className="sr-only">Carregando…</span>
        <div className="h-4 w-32 animate-pulse rounded-full bg-surface-2" />
        <div className="mt-6 h-10 w-2/3 animate-pulse rounded-[14px] bg-surface-2" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-surface-2" />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, indice) => (
            <div
              key={indice}
              className="overflow-hidden rounded-[14px] border border-line bg-surface"
            >
              <div className="aspect-[2/1] animate-pulse bg-surface-2" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-2" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-2" />
                <div className="h-3 w-full animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
