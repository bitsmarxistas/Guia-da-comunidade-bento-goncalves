"use client";

import { useId, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/ui/components/button";

/**
 * Painel de filtros (§5.3): uma única árvore de DOM.
 * No desktop é coluna fixa; no mobile abre por botão (aria-expanded) e continua
 * funcionando sem JS porque o formulário é GET nativo.
 */
export function FiltrosPainel({
  children,
  ativos,
}: {
  children: React.ReactNode;
  ativos: number;
}) {
  const [aberto, setAberto] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between md:hidden">
        <Button
          variant="outline"
          onClick={() => setAberto((valor) => !valor)}
          aria-expanded={aberto}
          aria-controls={id}
          className="w-full justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filtros
            {ativos > 0 ? (
              <span className="rounded-full bg-brand px-2 text-xs font-semibold text-on-brand">
                {ativos}
              </span>
            ) : null}
          </span>
          {aberto ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <span className="text-xs font-normal text-ink-mute">abrir</span>
          )}
        </Button>
      </div>

      <div
        id={id}
        className={aberto ? "block" : "hidden md:block"}
        aria-label="Filtros do catálogo"
      >
        {children}
      </div>
    </div>
  );
}
