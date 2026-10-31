"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/button";
import { desativarCategoriaAction } from "@/application/categorias/desativar";
import { reativarCategoriaAction } from "@/application/categorias/reativar";

export function BotaoStatusCategoria({
  id,
  ativa,
}: {
  id: string;
  ativa: boolean;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const alternar = () => {
    setErro(null);
    iniciar(async () => {
      const formData = new FormData();
      formData.append("id", id);
      const resultado = ativa
        ? await desativarCategoriaAction(null, formData)
        : await reativarCategoriaAction(null, formData);

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
        variant={ativa ? "destructive" : "outline"}
        onClick={alternar}
        disabled={pendente}
        className="h-10"
      >
        {pendente
          ? "Salvando…"
          : ativa
            ? "Desativar categoria"
            : "Reativar categoria"}
      </Button>
      {erro ? <span className="text-xs text-critical">{erro}</span> : null}
    </div>
  );
}
