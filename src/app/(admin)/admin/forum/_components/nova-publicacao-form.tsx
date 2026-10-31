"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { criarForumPublicacaoAction } from "@/application/governanca/forum";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NativeSelect } from "@/ui/components/native-select";
import { Textarea } from "@/ui/components/textarea";

interface EstadoFormulario {
  success?: boolean;
  error?: string;
}

interface NegocioPublicado {
  id: string;
  nome: string;
}

const TIPOS_PUBLICACAO = [
  { value: "comentario", label: "Comentário" },
  { value: "concordancia", label: "Concordância" },
  { value: "discordancia", label: "Discordância" },
] as const;

export function NovaPublicacaoForm({
  negocios,
}: {
  negocios: NegocioPublicado[];
}) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(criarForumPublicacaoAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  const semComercios = negocios.length === 0;

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
          <AlertTitle>Não foi possível publicar</AlertTitle>
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      ) : null}

      {estado.success ? (
        <Alert className="border-positive/30 bg-positive-tint">
          <CheckCircle aria-hidden="true" />
          <AlertTitle className="text-positive">Publicação criada</AlertTitle>
          <AlertDescription>
            A publicação já aparece na lista abaixo.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="negocioId">Comércio publicado</Label>
          <NativeSelect
            id="negocioId"
            name="negocioId"
            required
            defaultValue=""
            disabled={semComercios || pendente}
          >
            <option value="" disabled>
              Selecione um comércio
            </option>
            {negocios.map((negocio) => (
              <option key={negocio.id} value={negocio.id}>
                {negocio.nome}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <NativeSelect
            id="tipo"
            name="tipo"
            required
            defaultValue="comentario"
            disabled={semComercios || pendente}
          >
            {TIPOS_PUBLICACAO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="conteudo">Conteúdo</Label>
        <Textarea
          id="conteudo"
          name="conteudo"
          rows={4}
          required
          maxLength={5000}
          placeholder="Escreva a publicação do fórum..."
          disabled={semComercios || pendente}
          className="min-h-28"
        />
        <p className="text-xs text-ink-mute">Máximo de 5.000 caracteres.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={semComercios || pendente}
          className="h-10"
        >
          {pendente ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Publicando...
            </>
          ) : (
            "Publicar"
          )}
        </Button>

        {semComercios ? (
          <p className="text-sm text-ink-soft">
            Nenhum comércio publicado disponível. Publique um comércio em{" "}
            <Link
              href="/admin/negocios"
              className="font-medium text-brand hover:text-brand-strong hover:underline"
            >
              Comércios
            </Link>{" "}
            para abrir uma discussão.
          </p>
        ) : null}
      </div>
    </form>
  );
}
