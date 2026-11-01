// src/app/(admin)/admin/imagens/_components/fila-moderacao.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Textarea } from "@/ui/components/textarea";
import { Check, Loader2, X } from "lucide-react";

export interface ImagemFilaItem {
  id: string;
  url: string;
  tipo: string;
  negocioNome: string | null;
  negocioSlug?: string | null;
  /** Protocolo da solicitação dona da foto, quando ainda não há comércio. */
  protocolo?: string | null;
  solicitacaoId?: string | null;
  criadoEm: Date;
}

interface ModeracaoItemProps {
  imagem: ImagemFilaItem;
}

interface ResultadoModeracao {
  success: boolean;
  error?: string;
}

async function aplicarModeracao(params: {
  imagemId: string;
  acao: "aprovar" | "rejeitar";
  justificativa?: string;
}): Promise<ResultadoModeracao> {
  const response = await fetch(
    `/api/admin/imagens/${params.imagemId}/moderar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: params.acao,
        tipo: "imagem",
        ...(params.acao === "rejeitar"
          ? { justificativa: params.justificativa }
          : {}),
      }),
    },
  );

  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    const mensagem =
      data?.error ?? "Erro ao processar a imagem. Tente novamente.";
    return { success: false, error: mensagem };
  }

  return { success: true };
}

function ModeracaoItem({ imagem }: ModeracaoItemProps) {
  const router = useRouter();
  const [rejeitando, setRejeitando] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function executarModeracao(acao: "aprovar" | "rejeitar") {
    setErro(null);

    if (acao === "rejeitar" && justificativa.trim().length === 0) {
      setErro("Justificativa é obrigatória para rejeição.");
      return;
    }

    setCarregando(true);
    const resultado = await aplicarModeracao({
      imagemId: imagem.id,
      acao,
      justificativa: acao === "rejeitar" ? justificativa.trim() : undefined,
    });
    setCarregando(false);

    if (!resultado.success) {
      const mensagem = resultado.error ?? "Erro ao processar a imagem.";
      setErro(mensagem);
      toast.error(mensagem);
      return;
    }

    toast.success(
      acao === "aprovar"
        ? "Imagem aprovada. Ela aparece na ficha do comércio."
        : "Imagem rejeitada.",
    );
    router.refresh();
  }

  const nome = imagem.negocioNome ?? "Solicitação sem comércio publicado";
  const tipoLabel = imagem.tipo === "logo" ? "Logo" : "Foto";
  const dataFormatada = new Date(imagem.criadoEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-4">
          {/* Miniatura de moderação: <img> direto, sem otimizador, para ver o
              arquivo exatamente como foi enviado. */}
          <img
            src={imagem.url}
            alt={nome}
            width={96}
            height={96}
            className="size-24 shrink-0 rounded-lg border border-line bg-brand-tint object-cover"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-ink">{nome}</p>
              <Badge variant="secondary">{tipoLabel}</Badge>
            </div>
            {imagem.protocolo ? (
              <p className="text-sm text-ink-soft">
                Protocolo{" "}
                <span className="font-mono text-xs">{imagem.protocolo}</span>
              </p>
            ) : null}
            <p className="text-sm text-ink-soft">{dataFormatada}</p>
            {!imagem.negocioSlug ? (
              <p className="text-xs text-ink-mute">
                O cadastro ainda não foi aprovado: a foto fica guardada e
                aparece na ficha assim que o comércio for publicado.
              </p>
            ) : (
              <Link
                href={`/admin/negocios/${imagem.negocioSlug}`}
                className="inline-flex min-h-8 items-center text-xs font-semibold text-brand hover:underline"
              >
                Abrir ficha no painel
              </Link>
            )}
          </div>
        </div>

        {erro ? (
          <Alert variant="destructive">
            <AlertTitle>Erro na moderação</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-10"
            onClick={() => executarModeracao("aprovar")}
            disabled={carregando}
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Aprovar
              </>
            )}
          </Button>

          {rejeitando ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <Textarea
                value={justificativa}
                onChange={(event) => setJustificativa(event.target.value)}
                placeholder="Justificativa (obrigatória para rejeição)"
                rows={2}
                disabled={carregando}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-10"
                  onClick={() => executarModeracao("rejeitar")}
                  disabled={carregando}
                >
                  {carregando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Confirmar Rejeição
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setRejeitando(false);
                    setErro(null);
                    setJustificativa("");
                  }}
                  disabled={carregando}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10"
              onClick={() => setRejeitando(true)}
              disabled={carregando}
            >
              <X className="h-4 w-4" />
              Rejeitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ImagemFilaModeracaoProps {
  imagens: ImagemFilaItem[];
}

export function ImagemFilaModeracao({ imagens }: ImagemFilaModeracaoProps) {
  if (imagens.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {imagens.map((imagemItem) => (
        <ModeracaoItem key={imagemItem.id} imagem={imagemItem} />
      ))}
    </div>
  );
}
