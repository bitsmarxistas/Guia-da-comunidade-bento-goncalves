"use client";

import { useActionState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { apurarVotacaoAction } from "@/application/governanca/votacao";
import { Button } from "@/ui/components/button";

interface EstadoFormulario {
  success?: boolean;
  error?: string;
  resultado?: string;
}

const RESULTADOS: Record<string, string> = {
  aprovada: "aprovada",
  rejeitada: "rejeitada",
  sem_aprovacao: "sem aprovação",
};

async function apurar(
  prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = await apurarVotacaoAction(prevState, formData);

  if ("error" in resultado) {
    return { error: resultado.error };
  }

  return {
    success: true,
    resultado: RESULTADOS[resultado.resultado] ?? resultado.resultado,
  };
}

export function ApurarVotacaoForm({ votacaoId }: { votacaoId: string }) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(apurar, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="votacaoId" value={votacaoId} />

      <Button
        type="submit"
        variant="outline"
        disabled={pendente}
        className="h-10"
      >
        {pendente ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Apurando...
          </>
        ) : (
          <>
            <Gavel aria-hidden="true" />
            Apurar
          </>
        )}
      </Button>

      {estado.error ? (
        <p role="alert" className="text-sm text-critical">
          {estado.error}
        </p>
      ) : null}

      {estado.success ? (
        <p className="text-sm text-positive">
          Votação apurada: {estado.resultado}.
        </p>
      ) : null}
    </form>
  );
}
