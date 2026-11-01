// src/app/(admin)/admin/solicitacoes/[id]/_components/fotos-enviadas.tsx
import { asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { imagem } from "@/infrastructure/db/schema";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Toaster } from "@/ui/components/sonner";
import { ImagemFilaModeracao } from "@/app/(admin)/admin/imagens/_components/fila-moderacao";
import { protocoloDaSolicitacao } from "@/domain/solicitacoes/protocolo";

const ROTULOS: Record<string, string> = {
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

/**
 * Fotos que vieram com o pedido.
 *
 * A análise do cadastro e a moderação da foto são decisões separadas, mas
 * precisam estar na mesma tela: quem aprova o comércio quer ver — e liberar —
 * o que vai aparecer na ficha.
 */
export async function FotosEnviadas({
  solicitacaoId,
  nomeNegocio,
}: {
  solicitacaoId: string;
  nomeNegocio: string | null;
}) {
  const fotos = await db
    .select({
      id: imagem.id,
      url: imagem.url,
      tipo: imagem.tipo,
      situacao: imagem.situacao,
      justificativaRejeicao: imagem.justificativaRejeicao,
      criadoEm: imagem.criadoEm,
    })
    .from(imagem)
    .where(eq(imagem.solicitacaoId, solicitacaoId))
    .orderBy(asc(imagem.criadoEm));

  if (fotos.length === 0) return null;

  const pendentes = fotos
    .filter((foto) => foto.situacao === "pendente")
    .map((foto) => ({
      id: foto.id,
      url: foto.url,
      tipo: foto.tipo,
      negocioNome: nomeNegocio,
      negocioSlug: null,
      protocolo: protocoloDaSolicitacao(solicitacaoId),
      solicitacaoId,
      criadoEm: foto.criadoEm,
    }));

  const decididas = fotos.filter((foto) => foto.situacao !== "pendente");

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Fotos enviadas ({fotos.length})</CardTitle>
        <CardDescription>
          Aprovar o cadastro libera estas fotos na ficha pública. Rejeite aqui a
          foto que não deve aparecer — a rejeição vale mesmo depois da
          aprovação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendentes.length > 0 ? (
          <ImagemFilaModeracao imagens={pendentes} />
        ) : (
          <p className="text-sm text-ink-soft">
            Nenhuma foto aguardando moderação.
          </p>
        )}

        {decididas.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {decididas.map((foto) => (
              <li
                key={foto.id}
                className="overflow-hidden rounded-[12px] border border-line bg-surface"
              >
                <img
                  src={foto.url}
                  alt={`Foto ${ROTULOS[foto.situacao] ?? foto.situacao}`}
                  className="aspect-square w-full object-cover"
                />
                <div className="space-y-1 p-2">
                  <Badge
                    variant={
                      foto.situacao === "aprovada" ? "default" : "destructive"
                    }
                  >
                    {ROTULOS[foto.situacao] ?? foto.situacao}
                  </Badge>
                  {foto.justificativaRejeicao ? (
                    <p className="text-[11px] leading-snug text-ink-soft">
                      {foto.justificativaRejeicao}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      <Toaster position="bottom-right" richColors />
    </Card>
  );
}
