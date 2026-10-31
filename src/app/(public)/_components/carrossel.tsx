"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/components/button";

/**
 * Carrossel "Achados" (§4): scroll horizontal nativo (snap), arraste com mouse,
 * setas que avançam um card + gap, desabilitadas nas pontas e trilho de progresso.
 */
export function Carrossel({
  children,
  rotulo,
}: {
  children: React.ReactNode;
  rotulo: string;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const medir = useCallback(() => {
    const elemento = trilho.current;
    if (!elemento) return;
    const { scrollLeft, scrollWidth, clientWidth } = elemento;
    const maximo = scrollWidth - clientWidth;
    setPodeVoltar(scrollLeft > 4);
    setPodeAvancar(scrollLeft < maximo - 4);
    setProgresso(maximo > 0 ? Math.min(1, scrollLeft / maximo) : 0);
  }, []);

  useEffect(() => {
    const elemento = trilho.current;
    if (!elemento) return;
    medir();
    elemento.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => {
      elemento.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [medir]);

  const mover = (direcao: 1 | -1) => {
    const elemento = trilho.current;
    if (!elemento) return;
    const card = elemento.firstElementChild as HTMLElement | null;
    const passo = card ? card.offsetWidth + 16 : elemento.clientWidth * 0.8;
    elemento.scrollBy({ left: passo * direcao, behavior: "smooth" });
  };

  // Arraste com mouse (o toque já é nativo)
  useEffect(() => {
    const elemento = trilho.current;
    if (!elemento) return;
    let arrastando = false;
    let inicioX = 0;
    let inicioScroll = 0;

    const aoPressionar = (evento: PointerEvent) => {
      if (evento.pointerType !== "mouse") return;
      arrastando = true;
      inicioX = evento.clientX;
      inicioScroll = elemento.scrollLeft;
      elemento.style.cursor = "grabbing";
    };
    const aoMover = (evento: PointerEvent) => {
      if (!arrastando) return;
      elemento.scrollLeft = inicioScroll - (evento.clientX - inicioX);
    };
    const aoSoltar = () => {
      arrastando = false;
      elemento.style.cursor = "";
    };

    elemento.addEventListener("pointerdown", aoPressionar);
    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    return () => {
      elemento.removeEventListener("pointerdown", aoPressionar);
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
    };
  }, []);

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => mover(-1)}
          disabled={!podeVoltar}
          aria-label="Ver comércios anteriores"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => mover(1)}
          disabled={!podeAvancar}
          aria-label="Ver mais comércios"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div
        ref={trilho}
        className="carrossel-trilho cursor-grab"
        role="region"
        aria-label={rotulo}
        tabIndex={0}
      >
        {children}
      </div>

      <div
        className="mt-4 h-0.5 w-full rounded-full bg-line"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200"
          style={{ width: `${Math.max(12, progresso * 100)}%` }}
        />
      </div>
    </div>
  );
}
