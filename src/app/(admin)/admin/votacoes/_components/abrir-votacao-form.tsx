"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { abrirVotacaoAction } from "@/application/governanca/votacao";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NativeSelect } from "@/ui/components/native-select";
import { Textarea } from "@/ui/components/textarea";

interface ContestacaoAberta {
  id: string;
  rotulo: string;
}

interface EstadoFormulario {
  success?: boolean;
  error?: string;
}

async function abrirVotacao(
  prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const encerraEm = formData.get("encerraEm");

  if (typeof encerraEm === "string" && encerraEm.length > 0) {
    const data = new Date(encerraEm);

    if (Number.isNaN(data.getTime())) {
      return { error: "Informe uma data e hora válidas para o encerramento." };
    }

    if (data.getTime() <= Date.now()) {
      return { error: "O encerramento deve ser no futuro." };
    }

    // O input datetime-local não envia timezone; o navegador interpreta o
    // valor no fuso local e aqui ele vai para a action já em ISO UTC.
    formData.set("encerraEm", data.toISOString());
  }

  const resultado = await abrirVotacaoAction(prevState, formData);

  if ("error" in resultado) {
    return { error: resultado.error };
  }

  return { success: true };
}

export function AbrirVotacaoForm({
  contestacoes,
}: {
  contestacoes: ContestacaoAberta[];
}) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(abrirVotacao, {});
  const formRef = useRef<HTMLFormElement>(null);

  const semContestacoes = contestacoes.length === 0;

  useEffect(() => {
    if (estado.success) {
      formRef.current?.reset();
    }
  }, [estado.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {estado.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Não foi possível abrir a votação</AlertTitle>
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      ) : null}

      {estado.success ? (
        <Alert className="border-positive/30 bg-positive-tint">
          <CheckCircle aria-hidden="true" />
          <AlertTitle className="text-positive">Votação aberta</AlertTitle>
          <AlertDescription>
            A votação já aparece na lista abaixo, com o quórum congelado no
            momento da abertura.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="contestacaoId">Contestação aberta</Label>
        <NativeSelect
          id="contestacaoId"
          name="contestacaoId"
          required
          defaultValue=""
          disabled={semContestacoes || pendente}
        >
          <option value="" disabled>
            Selecione a contestação
          </option>
          {contestacoes.map((contestacao) => (
            <option key={contestacao.id} value={contestacao.id}>
              {contestacao.rotulo}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pergunta">Pergunta da votação</Label>
        <Textarea
          id="pergunta"
          name="pergunta"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          placeholder="Ex.: A publicação deste comércio deve ser mantida?"
          disabled={semContestacoes || pendente}
        />
        <p className="text-xs text-ink-mute">
          De 5 a 1.000 caracteres. O quórum é composto por todos os
          administradores ativos no momento da abertura.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="encerraEm">Encerra em</Label>
        <Input
          id="encerraEm"
          name="encerraEm"
          type="datetime-local"
          required
          disabled={semContestacoes || pendente}
          className="h-10"
        />
        <p className="text-xs text-ink-mute">
          O prazo é interpretado no fuso do seu navegador; deve ser no futuro.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={semContestacoes || pendente}
          className="h-10"
        >
          {pendente ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Abrindo...
            </>
          ) : (
            "Abrir votação"
          )}
        </Button>

        {semContestacoes ? (
          <p className="text-sm text-ink-soft">
            Não há contestação oficial aberta no momento. As contestações são
            abertas na análise de uma solicitação, em{" "}
            <Link
              href="/admin/solicitacoes"
              className="font-medium text-brand hover:text-brand-strong hover:underline"
            >
              Solicitações
            </Link>
            .
          </p>
        ) : null}
      </div>
    </form>
  );
}
