// src/app/(admin)/admin/imagens/page.tsx
import { db } from "@/infrastructure/db/client";
import { imagem, negocio } from "@/infrastructure/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Toaster } from "@/ui/components/sonner";
import { ImageOff } from "lucide-react";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import {
  ImagemFilaModeracao,
  type ImagemFilaItem,
} from "./_components/fila-moderacao";

async function contarPorSituacao(situacao: string): Promise<number> {
  const linhas = await db
    .select({ total: sql<number>`count(*)` })
    .from(imagem)
    .where(eq(imagem.situacao, situacao));

  const linha = linhas[0];
  return linha ? Number(linha.total ?? 0) : 0;
}

export default async function ImagensPage() {
  const [pendentes, aprovadas, rejeitadas] = await Promise.all([
    contarPorSituacao("pendente"),
    contarPorSituacao("aprovada"),
    contarPorSituacao("rejeitada"),
  ]);

  const fila = await db
    .select({
      id: imagem.id,
      url: imagem.url,
      tipo: imagem.tipo,
      negocioNome: negocio.nome,
      criadoEm: imagem.criadoEm,
    })
    .from(imagem)
    .leftJoin(negocio, eq(imagem.negocioId, negocio.id))
    .where(eq(imagem.situacao, "pendente"))
    .orderBy(desc(imagem.criadoEm))
    .limit(50);

  const imagensPendentes: ImagemFilaItem[] = fila.map(
    ({ id, url, tipo, negocioNome, criadoEm }) => ({
      id,
      url,
      tipo,
      negocioNome,
      criadoEm,
    }),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Imagens"
        description="Moderar imagens enviadas por solicitantes antes da publicação."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-warning tabular-nums">
              {pendentes}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-positive tabular-nums">
              {aprovadas}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-critical tabular-nums">
              {rejeitadas}
            </p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="fila-moderacao" className="space-y-4">
        <h2 id="fila-moderacao" className="text-lg font-semibold text-ink">
          Fila de moderação
        </h2>
        {imagensPendentes.length > 0 ? (
          <ImagemFilaModeracao imagens={imagensPendentes} />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <ImageOff className="h-8 w-8 text-ink-mute" aria-hidden="true" />
              <p className="font-medium text-ink">
                Nenhuma imagem pendente de moderação
              </p>
              <p className="max-w-md text-sm text-ink-soft">
                Quando solicitantes enviarem imagens para moderação, elas vão
                aparecer nesta fila para aprovação ou rejeição.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
