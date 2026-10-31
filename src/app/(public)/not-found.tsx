import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { Button } from "@/ui/components/button";

/**
 * 404 dentro da área pública: mesma estrutura do site, caminho de volta claro.
 * Antes o 404 era a tela padrão do Next, sem marca e sem navegação.
 */
export default function NotFound() {
  return (
    <div className="bg-canvas">
      <div className="container-page max-w-2xl py-20 text-center md:py-28">
        <p className="eyebrow">Erro 404</p>
        <h1 className="h1-editorial mt-3">
          Esta página não existe (ou mudou de lugar)
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-ink-soft">
          O endereço que você abriu não está no guia. Pode ser um link antigo ou
          um comércio que ainda não foi publicado.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/catalogo">
              <Search className="size-4" aria-hidden="true" />
              Ver o catálogo
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Compass className="size-4" aria-hidden="true" />
              Voltar ao início
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-ink-mute">
          É dono de um comércio e quer aparecer aqui?{" "}
          <Link
            href="/solicitar"
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Peça a inclusão
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
