// src/app/api/media/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { rateLimitUpload } from "@/infrastructure/auth/rate-limit";
import { criarUploadAssinado } from "@/application/midia/upload-publico";
import { db } from "@/infrastructure/db/client";
import { negocio } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

/*
 * Assina o envio de uma foto/anexo direto para o bucket.
 *
 * Público de propósito: quem preenche o formulário de participação não tem
 * conta. O que limita o abuso é a combinação de tipo, tamanho exato assinado e
 * limite por IP — não a autenticação.
 *
 * `negocioId` só é aceito para admin: é o caminho de "adicionar foto" na ficha
 * já publicada.
 */

const corpoSchema = z.object({
  finalidade: z.enum(["imagem", "anexo"]),
  mimeType: z.string().min(1),
  tamanhoBytes: z.number().positive(),
  negocioId: z.string().uuid().optional().nullable(),
});

function ipDaRequisicao(request: NextRequest): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

export async function POST(request: NextRequest) {
  const ip = ipDaRequisicao(request);

  const limite = await rateLimitUpload.limit(ip);
  if (!limite.success) {
    return NextResponse.json(
      {
        error:
          "Muitos envios em pouco tempo. Aguarde um minuto e tente de novo.",
      },
      { status: 429 },
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 },
    );
  }

  const parse = corpoSchema.safeParse(corpo);
  if (!parse.success) {
    const mensagem =
      Object.values(parse.error.flatten().fieldErrors).flat()[0] ??
      "Dados do arquivo inválidos.";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }

  const { finalidade, mimeType, tamanhoBytes, negocioId } = parse.data;
  let destinoNegocio: string | null = null;

  if (negocioId) {
    const admin = await getAdmin();
    if (!admin?.id) {
      return NextResponse.json(
        { error: "Entre no painel para enviar fotos do comércio." },
        { status: 401 },
      );
    }

    const existe = await db
      .select({ id: negocio.id })
      .from(negocio)
      .where(eq(negocio.id, negocioId))
      .limit(1);

    if (!existe.length) {
      return NextResponse.json(
        { error: "Comércio não encontrado." },
        { status: 404 },
      );
    }

    destinoNegocio = negocioId;
  }

  const resultado = await criarUploadAssinado({
    finalidade,
    mimeType,
    tamanhoBytes,
    negocioId: destinoNegocio,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({
    uploadUrl: resultado.uploadUrl,
    key: resultado.key,
    url: resultado.url,
    publicUrl: resultado.url,
    expiresIn: resultado.expiresIn,
  });
}
