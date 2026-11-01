// src/app/(admin)/admin/negocios/[id]/_components/fotos-do-negocio.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Toaster } from "@/ui/components/sonner";
import {
  ImageUpload,
  type MidiaEnviadaArquivo,
} from "@/ui/components/image-upload";

const ROTULOS: Record<string, string> = {
  pendente: "Aguardando moderação",
  aprovada: "Publicada",
  rejeitada: "Rejeitada",
};

export interface FotoDoNegocio {
  id: string;
  url: string;
  tipo: string;
  situacao: string;
}

/**
 * Fotos da ficha no painel.
 *
 * Serve para a equipe completar a ficha de um comércio que chegou sem foto — e
 * para o caminho inverso: a foto enviada aqui entra como `pendente` e passa
 * pela mesma moderação da fila de imagens.
 */
export function FotosDoNegocio({
  negocioId,
  fotos,
}: {
  negocioId: string;
  fotos: FotoDoNegocio[];
}) {
  const router = useRouter();
  const confirmadas = useRef<Set<string>>(new Set(fotos.map((f) => f.url)));
  const [salvando, setSalvando] = useState(false);

  async function registrar(arquivos: MidiaEnviadaArquivo[]) {
    const novos = arquivos.filter(
      (arquivo) => !confirmadas.current.has(arquivo.url),
    );
    if (novos.length === 0) return;

    setSalvando(true);
    let falhas = 0;

    for (const arquivo of novos) {
      try {
        const resposta = await fetch("/api/media/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "imagem",
            negocioId,
            key: arquivo.key,
            publicUrl: arquivo.url,
            mimeType: arquivo.fileType,
            tamanhoBytes: arquivo.fileSize,
            nomeOriginal: arquivo.fileName,
          }),
        });

        if (!resposta.ok) {
          falhas += 1;
          const corpo = (await resposta.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast.error(corpo?.error ?? "Não foi possível registrar a foto.");
          continue;
        }

        confirmadas.current.add(arquivo.url);
      } catch {
        falhas += 1;
        toast.error("Falha de conexão ao registrar a foto.");
      }
    }

    setSalvando(false);

    if (novos.length > falhas) {
      toast.success(
        falhas === 0
          ? "Foto adicionada. Ela entra na moderação antes de aparecer."
          : "Algumas fotos foram adicionadas.",
      );
      router.refresh();
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Fotos da ficha</CardTitle>
        <CardDescription>
          Toda foto nova entra como <strong>pendente</strong> e precisa de
          aprovação em Imagens antes de aparecer no site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fotos.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((foto) => (
              <li
                key={foto.id}
                className="overflow-hidden rounded-[12px] border border-line bg-surface"
              >
                <img
                  src={foto.url}
                  alt={`Foto da ficha (${foto.tipo})`}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <Badge
                    variant={
                      foto.situacao === "aprovada"
                        ? "default"
                        : foto.situacao === "rejeitada"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {ROTULOS[foto.situacao] ?? foto.situacao}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">
            Este comércio ainda não tem foto. Envie a primeira abaixo.
          </p>
        )}

        <div
          className={salvando ? "pointer-events-none opacity-70" : undefined}
        >
          <ImageUpload
            negocioId={negocioId}
            label="Adicionar fotos"
            description="JPG, PNG ou WebP até 5 MB. A imagem é reduzida antes de subir."
            maxFiles={4}
            onUploadComplete={registrar}
          />
        </div>
        {salvando ? (
          <p className="text-xs text-ink-mute" role="status">
            Registrando as fotos…
          </p>
        ) : null}
      </CardContent>
      <Toaster position="bottom-right" richColors />
    </Card>
  );
}
