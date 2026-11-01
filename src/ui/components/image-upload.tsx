// src/ui/components/image-upload.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { cn } from "@/lib/utils";
import {
  LIMITE_ANEXO_BYTES,
  LIMITE_IMAGEM_BYTES,
  MAX_ANEXOS_POR_SOLICITACAO,
  MAX_FOTOS_POR_SOLICITACAO,
  MIMES_ANEXO,
  MIMES_IMAGEM,
} from "@/domain/midia/arquivo";

/*
 * Envio de fotos e anexos do site.
 *
 * O arquivo vai do navegador direto para o bucket: pedimos uma URL assinada em
 * /api/media/upload-url, gravamos com PUT e devolvemos ao formulário apenas a
 * chave e a URL pública. Antes este componente "simulava" o upload — gerava uma
 * chave falsa `temp/...` e mandava o preview local —, então a foto nunca
 * chegava ao servidor, a fila de moderação ficava vazia e nada podia ser
 * aprovado ou publicado.
 *
 * Fotos são reduzidas para no máximo 1600 px e convertidas em WebP antes de
 * subir: uma foto de celular de 4 MB vira ~300 KB, o que cabe no limite de
 * corpo da Vercel caso a assinatura falhe e a imagem precise ser reenviada.
 */

export interface MidiaEnviadaArquivo {
  key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  tipo?: "logo" | "foto";
}

interface ItemEnvio {
  id: string;
  arquivo: File;
  fileName: string;
  fileType: string;
  fileSize: number;
  preview?: string;
  estado: "enviando" | "enviada" | "erro";
  progresso: number;
  erro?: string;
  key?: string;
  url?: string;
}

interface PropsBase {
  label?: string;
  description?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  /** Comércio existente: só o painel manda, e o servidor exige admin. */
  negocioId?: string;
  disabled?: boolean;
  onUploadComplete?: (arquivos: MidiaEnviadaArquivo[]) => void;
  /** Avisa o formulário quando ainda há envio em andamento. */
  onStatusChange?: (enviando: boolean) => void;
}

interface ImageUploadProps extends PropsBase {
  tipo?: "logo" | "foto";
  initialFiles?: MidiaEnviadaArquivo[];
}

type FileUploadProps = PropsBase;

const MAX_LADO_IMAGEM = 1600;
const QUALIDADE_IMAGEM = 0.82;

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function idLocal(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Reduz a foto antes de subir. Devolve `null` quando o navegador não consegue
 * decodificar (formato estranho, arquivo corrompido) — nesse caso o original é
 * enviado, desde que caiba no limite.
 */
async function comprimirImagem(arquivo: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const maiorLado = Math.max(bitmap.width, bitmap.height);
    const escala =
      maiorLado > MAX_LADO_IMAGEM ? MAX_LADO_IMAGEM / maiorLado : 1;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));

    const contexto = canvas.getContext("2d");
    if (!contexto) {
      bitmap.close?.();
      return null;
    }

    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const convertido = await new Promise<Blob | null>((resolver) => {
      canvas.toBlob(resolver, "image/webp", QUALIDADE_IMAGEM);
    });

    if (!convertido || convertido.type !== "image/webp") return null;
    return convertido;
  } catch {
    return null;
  }
}

function enviarParaBucket(
  urlAssinada: string,
  corpo: Blob,
  mimeType: string,
  aoProgredir: (percentual: number) => void,
): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", urlAssinada);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.timeout = 60_000;

    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable && evento.total > 0) {
        aoProgredir(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100);
        resolver();
      } else {
        rejeitar(
          new Error(
            "O servidor de imagens recusou o arquivo. Tente enviar de novo.",
          ),
        );
      }
    };
    xhr.onerror = () =>
      rejeitar(new Error("Falha de conexão ao enviar o arquivo."));
    xhr.ontimeout = () =>
      rejeitar(new Error("O envio demorou demais. Tente de novo."));

    xhr.send(corpo);
  });
}

async function pedirUrlAssinada(dados: {
  finalidade: "imagem" | "anexo";
  mimeType: string;
  tamanhoBytes: number;
  negocioId?: string;
}): Promise<{ uploadUrl: string; key: string; url: string }> {
  const resposta = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  const corpo = (await resposta.json().catch(() => null)) as {
    uploadUrl?: string;
    key?: string;
    url?: string;
    error?: string;
  } | null;

  if (!resposta.ok || !corpo?.uploadUrl || !corpo.key || !corpo.url) {
    throw new Error(
      corpo?.error ?? "Não foi possível preparar o envio. Tente de novo.",
    );
  }

  return { uploadUrl: corpo.uploadUrl, key: corpo.key, url: corpo.url };
}

export function ImageUpload({
  label = "Fotos",
  description = "Até 4 fotos em JPG, PNG ou WebP, com no máximo 5 MB cada.",
  maxFiles = MAX_FOTOS_POR_SOLICITACAO,
  maxSizeMB = LIMITE_IMAGEM_BYTES / (1024 * 1024),
  tipo = "foto",
  negocioId,
  disabled = false,
  onUploadComplete,
  onStatusChange,
  initialFiles = [],
}: ImageUploadProps) {
  const [itens, setItens] = useState<ItemEnvio[]>(() =>
    initialFiles.map((arquivo) => ({
      id: idLocal(),
      arquivo: new File([], arquivo.fileName, { type: arquivo.fileType }),
      fileName: arquivo.fileName,
      fileType: arquivo.fileType,
      fileSize: arquivo.fileSize,
      estado: "enviada" as const,
      progresso: 100,
      key: arquivo.key,
      url: arquivo.url,
    })),
  );
  const [erroGeral, setErroGeral] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const callbacksRef = useRef({ onUploadComplete, onStatusChange });

  // Sincronizar os callbacks em efeito (e não no corpo do componente): o React
  // proíbe escrever em ref durante a renderização.
  useEffect(() => {
    callbacksRef.current = { onUploadComplete, onStatusChange };
  }, [onUploadComplete, onStatusChange]);

  const atualizar = useCallback((id: string, mudanca: Partial<ItemEnvio>) => {
    setItens((atual) =>
      atual.map((item) => (item.id === id ? { ...item, ...mudanca } : item)),
    );
  }, []);

  const enviarArquivo = useCallback(
    async (item: ItemEnvio) => {
      atualizar(item.id, {
        estado: "enviando",
        progresso: 0,
        erro: undefined,
      });

      try {
        const comprimido = await comprimirImagem(item.arquivo);
        const corpo: Blob = comprimido ?? item.arquivo;
        const mimeType = comprimido
          ? "image/webp"
          : item.arquivo.type || "image/jpeg";

        const assinatura = await pedirUrlAssinada({
          finalidade: "imagem",
          mimeType,
          tamanhoBytes: corpo.size,
          ...(negocioId ? { negocioId } : {}),
        });

        await enviarParaBucket(
          assinatura.uploadUrl,
          corpo,
          mimeType,
          (percentual) => atualizar(item.id, { progresso: percentual }),
        );

        atualizar(item.id, {
          estado: "enviada",
          progresso: 100,
          key: assinatura.key,
          url: assinatura.url,
          fileType: mimeType,
          fileSize: corpo.size,
        });
      } catch (erro) {
        atualizar(item.id, {
          estado: "erro",
          progresso: 0,
          erro:
            erro instanceof Error
              ? erro.message
              : "Não foi possível enviar a imagem.",
        });
      }
    },
    [atualizar, negocioId],
  );

  const adicionar = useCallback(
    async (selecionados: FileList) => {
      setErroGeral("");
      const espaco = maxFiles - itens.length;
      if (espaco <= 0) {
        setErroGeral(`Limite de ${maxFiles} fotos atingido.`);
        return;
      }

      const aceitos: File[] = [];
      const recusados: string[] = [];

      for (const arquivo of Array.from(selecionados)) {
        if (aceitos.length >= espaco) {
          recusados.push(
            `Limite de ${maxFiles} fotos: "${arquivo.name}" ficou de fora.`,
          );
          continue;
        }

        const tipoPermitido = (MIMES_IMAGEM as readonly string[]).includes(
          arquivo.type,
        );
        if (!tipoPermitido) {
          recusados.push(`"${arquivo.name}": envie JPG, PNG ou WebP.`);
          continue;
        }
        if (arquivo.size > maxSizeMB * 1024 * 1024) {
          recusados.push(`"${arquivo.name}" passa de ${maxSizeMB} MB.`);
          continue;
        }

        aceitos.push(arquivo);
      }

      if (recusados.length > 0) setErroGeral(recusados.join(" "));
      if (aceitos.length === 0) return;

      const novos: ItemEnvio[] = aceitos.map((arquivo) => ({
        id: idLocal(),
        arquivo,
        fileName: arquivo.name,
        fileType: arquivo.type,
        fileSize: arquivo.size,
        preview: URL.createObjectURL(arquivo),
        estado: "enviando",
        progresso: 0,
      }));

      setItens((atual) => [...atual, ...novos]);
      for (const item of novos) {
        void enviarArquivo(item);
      }
    },
    [enviarArquivo, itens.length, maxFiles, maxSizeMB],
  );

  const remover = useCallback((id: string) => {
    setItens((atual) => {
      const alvo = atual.find((item) => item.id === id);
      if (alvo?.preview) URL.revokeObjectURL(alvo.preview);
      return atual.filter((item) => item.id !== id);
    });
  }, []);

  const enviando = itens.some((item) => item.estado === "enviando");

  useEffect(() => {
    const concluidos: MidiaEnviadaArquivo[] = itens
      .filter((item) => item.estado === "enviada" && item.key && item.url)
      .map((item) => ({
        key: item.key!,
        url: item.url!,
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        tipo,
      }));

    callbacksRef.current.onUploadComplete?.(concluidos);
    callbacksRef.current.onStatusChange?.(enviando);
  }, [itens, tipo, enviando]);

  return (
    <div className="space-y-3">
      <Label className="block text-[13px] font-semibold text-ink">
        {label}
      </Label>
      <p className="text-sm text-ink-soft">{description}</p>

      {erroGeral ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[10px] border border-critical/30 bg-critical-tint px-3 py-2 text-sm text-critical"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {erroGeral}
        </p>
      ) : null}

      <div
        className={cn(
          "relative rounded-[14px] border-2 border-dashed border-line bg-canvas p-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-brand/50",
        )}
        onClick={disabled ? undefined : () => inputRef.current?.click()}
        onDragOver={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
        }}
        onDrop={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          if (!disabled && evento.dataTransfer.files.length > 0) {
            void adicionar(evento.dataTransfer.files);
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(evento) => {
          if ((evento.key === "Enter" || evento.key === " ") && !disabled) {
            evento.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          id="image-upload"
          type="file"
          multiple
          accept={MIMES_IMAGEM.join(",")}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          disabled={disabled || itens.length >= maxFiles}
          onChange={(evento) => {
            if (evento.target.files && evento.target.files.length > 0) {
              void adicionar(evento.target.files);
            }
            evento.target.value = "";
          }}
          aria-label="Escolher fotos"
        />
        <Upload
          className="mx-auto mb-2 size-8 text-ink-mute"
          aria-hidden="true"
        />
        <p className="text-sm text-ink-soft">
          {disabled
            ? "Envio desabilitado"
            : itens.length >= maxFiles
              ? `Limite de ${maxFiles} fotos atingido`
              : `Clique ou arraste até ${maxFiles} fotos`}
        </p>
        <p className="mt-1 text-xs text-ink-mute">
          JPG, PNG ou WebP · até {maxSizeMB} MB cada
        </p>
      </div>

      {itens.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {itens.map((item) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-[12px] border border-line bg-surface"
            >
              <div className="relative aspect-square bg-brand-tint">
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.fileName}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-mute">
                    <ImageIcon className="size-6" aria-hidden="true" />
                  </div>
                )}

                {item.estado === "enviando" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/60 text-on-brand">
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold">
                      {item.progresso}%
                    </span>
                  </div>
                ) : null}

                {item.estado === "erro" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-critical/80 p-2 text-center text-on-brand">
                    <AlertCircle className="size-5" aria-hidden="true" />
                    <span className="text-[11px] leading-snug">
                      Não foi enviada
                    </span>
                  </div>
                ) : null}

                {item.estado === "enviada" ? (
                  <CheckCircle2
                    className="absolute right-1.5 top-1.5 size-5 rounded-full bg-surface text-positive"
                    aria-hidden="true"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={(evento) => {
                    evento.stopPropagation();
                    remover(item.id);
                  }}
                  className="absolute left-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full bg-surface/90 text-ink-soft transition-colors hover:text-critical focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                  aria-label={`Remover ${item.fileName}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-medium text-ink">
                  {item.fileName}
                </p>
                <p className="text-[11px] text-ink-mute">
                  {formatarTamanho(item.fileSize)}
                </p>
                {item.estado === "erro" ? (
                  <div className="space-y-1">
                    <p className="text-[11px] leading-snug text-critical">
                      {item.erro ?? "Falha no envio."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 w-full text-xs"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        void enviarArquivo(item);
                      }}
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Tentar de novo
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-ink-mute" aria-live="polite">
        {itens.filter((item) => item.estado === "enviada").length}/{maxFiles}{" "}
        fotos enviadas
        {enviando ? " · enviando…" : ""}
      </p>
    </div>
  );
}

export function FileUpload({
  label = "Anexos",
  description = "Opcional. PDF, DOC ou DOCX até 10 MB.",
  maxFiles = MAX_ANEXOS_POR_SOLICITACAO,
  maxSizeMB = LIMITE_ANEXO_BYTES / (1024 * 1024),
  negocioId,
  disabled = false,
  onUploadComplete,
  onStatusChange,
}: FileUploadProps) {
  const [itens, setItens] = useState<ItemEnvio[]>([]);
  const [erroGeral, setErroGeral] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const callbacksRef = useRef({ onUploadComplete, onStatusChange });

  // Sincronizar os callbacks em efeito (e não no corpo do componente): o React
  // proíbe escrever em ref durante a renderização.
  useEffect(() => {
    callbacksRef.current = { onUploadComplete, onStatusChange };
  }, [onUploadComplete, onStatusChange]);

  const atualizar = useCallback((id: string, mudanca: Partial<ItemEnvio>) => {
    setItens((atual) =>
      atual.map((item) => (item.id === id ? { ...item, ...mudanca } : item)),
    );
  }, []);

  const enviarArquivo = useCallback(
    async (item: ItemEnvio) => {
      atualizar(item.id, { estado: "enviando", progresso: 0, erro: undefined });

      try {
        const mimeType = item.arquivo.type || "application/pdf";
        const assinatura = await pedirUrlAssinada({
          finalidade: "anexo",
          mimeType,
          tamanhoBytes: item.arquivo.size,
          ...(negocioId ? { negocioId } : {}),
        });

        await enviarParaBucket(
          assinatura.uploadUrl,
          item.arquivo,
          mimeType,
          (percentual) => atualizar(item.id, { progresso: percentual }),
        );

        atualizar(item.id, {
          estado: "enviada",
          progresso: 100,
          key: assinatura.key,
          url: assinatura.url,
          fileType: mimeType,
          fileSize: item.arquivo.size,
        });
      } catch (erro) {
        atualizar(item.id, {
          estado: "erro",
          progresso: 0,
          erro:
            erro instanceof Error
              ? erro.message
              : "Não foi possível enviar o anexo.",
        });
      }
    },
    [atualizar, negocioId],
  );

  const adicionar = useCallback(
    (selecionados: FileList) => {
      setErroGeral("");
      const espaco = maxFiles - itens.length;
      if (espaco <= 0) {
        setErroGeral(`Limite de ${maxFiles} anexos atingido.`);
        return;
      }

      const aceitos: File[] = [];
      const recusados: string[] = [];

      for (const arquivo of Array.from(selecionados)) {
        if (aceitos.length >= espaco) {
          recusados.push(`Limite de ${maxFiles} anexos.`);
          continue;
        }
        if (!(MIMES_ANEXO as readonly string[]).includes(arquivo.type)) {
          recusados.push(`"${arquivo.name}": envie PDF, DOC ou DOCX.`);
          continue;
        }
        if (arquivo.size > maxSizeMB * 1024 * 1024) {
          recusados.push(`"${arquivo.name}" passa de ${maxSizeMB} MB.`);
          continue;
        }
        aceitos.push(arquivo);
      }

      if (recusados.length > 0) setErroGeral(recusados.join(" "));
      if (aceitos.length === 0) return;

      const novos: ItemEnvio[] = aceitos.map((arquivo) => ({
        id: idLocal(),
        arquivo,
        fileName: arquivo.name,
        fileType: arquivo.type,
        fileSize: arquivo.size,
        estado: "enviando",
        progresso: 0,
      }));

      setItens((atual) => [...atual, ...novos]);
      for (const item of novos) {
        void enviarArquivo(item);
      }
    },
    [enviarArquivo, itens.length, maxFiles, maxSizeMB],
  );

  const enviando = itens.some((item) => item.estado === "enviando");

  useEffect(() => {
    const concluidos: MidiaEnviadaArquivo[] = itens
      .filter((item) => item.estado === "enviada" && item.key && item.url)
      .map((item) => ({
        key: item.key!,
        url: item.url!,
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
      }));

    callbacksRef.current.onUploadComplete?.(concluidos);
    callbacksRef.current.onStatusChange?.(enviando);
  }, [itens, enviando]);

  return (
    <div className="space-y-3">
      <Label className="block text-[13px] font-semibold text-ink">
        {label}
      </Label>
      <p className="text-sm text-ink-soft">{description}</p>

      {erroGeral ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[10px] border border-critical/30 bg-critical-tint px-3 py-2 text-sm text-critical"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {erroGeral}
        </p>
      ) : null}

      <div
        className={cn(
          "relative rounded-[14px] border-2 border-dashed border-line bg-canvas p-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-brand/50",
        )}
        onClick={disabled ? undefined : () => inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(evento) => {
          if ((evento.key === "Enter" || evento.key === " ") && !disabled) {
            evento.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          multiple
          accept={MIMES_ANEXO.join(",")}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          disabled={disabled || itens.length >= maxFiles}
          onChange={(evento) => {
            if (evento.target.files && evento.target.files.length > 0) {
              adicionar(evento.target.files);
            }
            evento.target.value = "";
          }}
          aria-label="Escolher anexos"
        />
        <FileText
          className="mx-auto mb-2 size-8 text-ink-mute"
          aria-hidden="true"
        />
        <p className="text-sm text-ink-soft">
          {disabled
            ? "Envio desabilitado"
            : itens.length >= maxFiles
              ? `Limite de ${maxFiles} anexos atingido`
              : `Clique ou arraste até ${maxFiles} arquivos`}
        </p>
        <p className="mt-1 text-xs text-ink-mute">
          PDF, DOC ou DOCX · até {maxSizeMB} MB cada
        </p>
      </div>

      {itens.length > 0 ? (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-[10px] border border-line bg-surface p-3"
            >
              <FileText
                className="size-5 shrink-0 text-ink-mute"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {item.fileName}
                </p>
                <p className="text-xs text-ink-mute">
                  {formatarTamanho(item.fileSize)}
                  {item.estado === "enviando" ? ` · ${item.progresso}%` : ""}
                  {item.estado === "enviada" ? " · enviado" : ""}
                  {item.estado === "erro" ? ` · ${item.erro ?? "falhou"}` : ""}
                </p>
              </div>
              {item.estado === "enviando" ? (
                <Loader2
                  className="size-4 animate-spin text-ink-mute"
                  aria-hidden="true"
                />
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setItens((atual) => atual.filter((i) => i.id !== item.id))
                }
                className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-critical focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                aria-label={`Remover ${item.fileName}`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-ink-mute" aria-live="polite">
        {itens.filter((item) => item.estado === "enviada").length}/{maxFiles}{" "}
        anexos enviados
        {enviando ? " · enviando…" : ""}
      </p>
    </div>
  );
}
