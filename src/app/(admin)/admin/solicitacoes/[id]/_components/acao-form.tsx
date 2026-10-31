"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NativeSelect } from "@/ui/components/native-select";
import { Textarea } from "@/ui/components/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { AlertCircle, CheckCircle, Loader2, Info } from "lucide-react";
import { analisarSolicitacaoAction } from "@/application/solicitacoes/analise";
import {
  motivoBloqueioDecisao,
  rotuloSituacao,
  situacaoDecidivel,
} from "@/domain/solicitacoes/situacao";

const DECISAO_OPTIONS = [
  { value: "aprovar", label: "Aprovar e publicar" },
  { value: "reprovar", label: "Reprovar" },
  { value: "solicitar_correcao", label: "Pedir correção ao solicitante" },
] as const;

type Decisao = (typeof DECISAO_OPTIONS)[number]["value"];

interface AcaoState {
  success: boolean;
  error: string | null | undefined;
  situacao?: string;
  negocioId?: string;
  negocioSlug?: string;
}

async function analisarSolicitacaoActionWrapper(
  prevState: AcaoState,
  formData: FormData,
): Promise<AcaoState> {
  const result = await analisarSolicitacaoAction(null, formData);
  if ("error" in result && result.error) {
    return { success: false, error: result.error };
  }
  return {
    success: true,
    error: null,
    situacao: (result as { situacao?: string }).situacao,
    negocioId: (result as { negocioId?: string }).negocioId,
    negocioSlug: (result as { negocioSlug?: string }).negocioSlug,
  };
}

export function AcaoForm({
  solicitacaoId,
  situacao,
}: {
  solicitacaoId: string;
  situacao: string;
}) {
  const [state, formAction, isPending] = useActionState(
    analisarSolicitacaoActionWrapper,
    { success: false, error: null },
  );
  const [decisao, setDecisao] = useState<Decisao | "">("");
  const [justificativa, setJustificativa] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const podeDecidir = situacaoDecidivel(situacao);
  const bloqueio = motivoBloqueioDecisao(situacao);
  const exigeJustificativa =
    decisao === "reprovar" || decisao === "solicitar_correcao";

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    if (exigeJustificativa && justificativa.trim().length < 10) {
      evento.preventDefault();
      setErroLocal(
        "Escreva a justificativa (mínimo 10 caracteres) — ela é enviada ao solicitante por e-mail.",
      );
      return;
    }
    setErroLocal(null);
  }

  return (
    <form action={formAction} onSubmit={aoEnviar} className="space-y-4">
      <input type="hidden" name="solicitacaoId" value={solicitacaoId} />

      {!podeDecidir ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>
            Sem ação individual — {rotuloSituacao(situacao).toLowerCase()}
          </AlertTitle>
          <AlertDescription>{bloqueio}</AlertDescription>
        </Alert>
      ) : null}

      {(state.error || erroLocal) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{erroLocal ?? state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-positive/30 bg-positive-tint">
          <CheckCircle className="h-4 w-4 text-positive" />
          <AlertTitle className="text-positive">Decisão registrada</AlertTitle>
          <AlertDescription>
            <p>
              Situação agora:{" "}
              <strong>{rotuloSituacao(state.situacao ?? "")}</strong>. O
              solicitante é avisado por e-mail.
            </p>
            {state.negocioSlug ? (
              <Link
                href={`/negocio/${state.negocioSlug}`}
                className="mt-1 inline-block font-semibold underline underline-offset-4"
              >
                Ver a ficha publicada
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="decisao">Decisão</Label>
        <NativeSelect
          name="decisao"
          id="decisao"
          required
          value={decisao}
          disabled={!podeDecidir || isPending}
          onChange={(evento) => setDecisao(evento.target.value as Decisao | "")}
        >
          <option value="">Selecione a decisão</option>
          {DECISAO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="justificativa">
          Justificativa{" "}
          {exigeJustificativa ? (
            <span className="text-critical">(obrigatória)</span>
          ) : (
            <span className="text-ink-mute">(opcional)</span>
          )}
        </Label>
        <Textarea
          name="justificativa"
          id="justificativa"
          rows={3}
          value={justificativa}
          onChange={(evento) => setJustificativa(evento.target.value)}
          placeholder={
            exigeJustificativa
              ? "Explique o motivo — o texto vai para o e-mail do solicitante."
              : "Opcional: registre como os dados foram conferidos."
          }
          disabled={!podeDecidir || isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoesInternas">
          Observações internas (não vão para o solicitante)
        </Label>
        <Textarea
          name="observacoesInternas"
          id="observacoesInternas"
          rows={2}
          placeholder="Notas para a equipe..."
          disabled={!podeDecidir || isPending}
        />
      </div>

      <Button type="submit" disabled={!podeDecidir || isPending || !decisao}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Processando...
          </>
        ) : (
          "Registrar decisão"
        )}
      </Button>
    </form>
  );
}
