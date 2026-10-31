"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { publicarNegocioAction } from "@/application/negocios/publicar";
import { despublicarNegocioAction } from "@/application/negocios/publicar";

export function BotaoPublicacao({
  id,
  publicado,
}: {
  id: string;
  publicado: boolean;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const alternar = () => {
    setErro(null);
    iniciar(async () => {
      const formData = new FormData();
      formData.append("id", id);
      const resultado = publicado
        ? await despublicarNegocioAction(null, formData)
        : await publicarNegocioAction(null, formData);

      if ("error" in resultado && resultado.error) {
        setErro(String(resultado.error));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={publicado ? "destructive" : "default"}
        onClick={alternar}
        disabled={pendente}
        className="h-10"
      >
        {pendente ? "Salvando…" : publicado ? "Despublicar" : "Publicar"}
      </Button>
      {erro ? <span className="text-xs text-critical">{erro}</span> : null}
    </div>
  );
}
