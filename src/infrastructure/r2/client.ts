// src/infrastructure/r2/client.ts
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/shared/env";

/*
 * Cliente do bucket de imagens (Cloudflare R2).
 *
 * Este módulo NÃO é `"use server"`: ele guarda a credencial da conta e não pode
 * ser exposto como server action para o navegador. Quem precisar dele importa
 * do lado do servidor (rotas, actions e scripts).
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

export function urlPublicaDaChave(chave: string): string {
  const base = (env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/${chave}` : "";
}

export interface AssinaturaUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * URL assinada para o navegador gravar o arquivo direto no R2.
 *
 * Vai com `ContentLength` e `ContentType` assinados: o R2 recusa o PUT se o
 * corpo tiver outro tamanho ou outro tipo, então a URL não serve para subir um
 * arquivo maior do que o combinado. Isso também contorna o limite de 4,5 MB de
 * corpo das funções da Vercel — o arquivo nunca passa pelo servidor.
 */
export async function assinarUpload(
  chave: string,
  contentType: string,
  tamanhoBytes: number,
  expiresIn = 900,
): Promise<AssinaturaUpload> {
  const comando = new PutObjectCommand({
    Bucket: BUCKET,
    Key: chave,
    ContentType: contentType,
    ContentLength: tamanhoBytes,
  });

  const uploadUrl = await getSignedUrl(r2Client, comando, { expiresIn });

  return {
    uploadUrl,
    key: chave,
    publicUrl: urlPublicaDaChave(chave),
    expiresIn,
  };
}

/** Confere se o objeto chegou mesmo ao bucket (usado antes de gravar a linha). */
export async function objetoExiste(chave: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: chave }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(
  key: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "Falha ao excluir arquivo" };
  }
}
