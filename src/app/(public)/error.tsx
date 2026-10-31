"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/ui/components/button";

/**
 * Fronteira de erro da área pública (§5.7/§8).
 * Mostra o que aconteceu em português, oferece tentar de novo e um caminho de
 * volta — sem stack trace e sem a tela branca do Next.
 */
export default function ErroPublico({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Público] erro de renderização:", error);
  }, [error]);

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-2xl py-20 text-center md:py-28">
        <AlertTriangle
          className="mx-auto size-10 text-brand"
          aria-hidden="true"
        />
        <h1 className="h1-editorial mt-4">
          Algo falhou ao carregar esta página
        </h1>
        <p className="mx-auto mt-4 max-w-[48ch] text-ink-soft">
          O problema é do nosso lado, não do seu. Tente de novo — se continuar,
          volte em alguns minutos ou fale com a administração do guia.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-ink-mute">
            Código do erro: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Tentar de novo
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Ir para o início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
