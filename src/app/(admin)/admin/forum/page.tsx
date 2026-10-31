// src/app/(admin)/admin/forum/page.tsx
import Link from "next/link";
import { count, countDistinct, gte, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { forumPublicacao } from "@/infrastructure/db/schema";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { NovaPublicacaoForm } from "./_components/nova-publicacao-form";

const TIPO_LABELS: Record<string, string> = {
  comentario: "Comentário",
  concordancia: "Concordância",
  discordancia: "Discordância",
};

const TIPO_CLASSES: Record<string, string> = {
  comentario: "border-line bg-surface-2 text-ink-soft",
  concordancia: "border-positive/30 bg-positive-tint text-positive",
  discordancia: "border-critical/30 bg-critical-tint text-critical",
};

const SITUACAO_PUBLICACAO_LABELS: Record<string, string> = {
  publicado: "Publicado",
  oculto_contestacao: "Oculto por contestação",
  nao_publicado: "Não publicado",
  rascunho: "Rascunho",
  expirado: "Expirado",
  nao_elegivel: "Não elegível",
};

const SITUACAO_PUBLICACAO_CLASSES: Record<string, string> = {
  publicado: "border-positive/30 bg-positive-tint text-positive",
  oculto_contestacao: "border-warning/30 bg-warning-tint text-warning",
  expirado: "border-critical/30 bg-critical-tint text-critical",
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function ForumPage() {
  const [
    publicacoes,
    negociosPublicados,
    totalPublicacoesResult,
    recentesResult,
    comerciosComPublicacaoResult,
  ] = await Promise.all([
    db.query.forumPublicacao.findMany({
      orderBy: (publicacao, { desc }) => [desc(publicacao.criadaEm)],
      limit: 100,
      with: {
        autor: { columns: { id: true, nome: true } },
        negocio: {
          columns: {
            id: true,
            nome: true,
            slug: true,
            situacaoPublicacao: true,
          },
        },
      },
    }),
    db.query.negocio.findMany({
      where: (negocio, { eq }) => eq(negocio.situacaoPublicacao, "publicado"),
      columns: { id: true, nome: true },
      orderBy: (negocio, { asc }) => [asc(negocio.nome)],
    }),
    db.select({ total: count() }).from(forumPublicacao),
    db
      .select({ total: count() })
      .from(forumPublicacao)
      // now() no banco evita tempo impuro no render (regra react-hooks/purity).
      .where(gte(forumPublicacao.criadaEm, sql`now() - interval '7 days'`)),
    db
      .select({ total: countDistinct(forumPublicacao.negocioId) })
      .from(forumPublicacao),
  ]);

  const totalPublicacoes = totalPublicacoesResult[0]?.total ?? 0;
  const publicacoesRecentes = recentesResult[0]?.total ?? 0;
  const comerciosComPublicacao = comerciosComPublicacaoResult[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fórum"
        description="Publicações e discussões reais do fórum, sempre vinculadas a um comércio. Área restrita à administração."
        restrito
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total de publicações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {totalPublicacoes}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {publicacoesRecentes}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Comércios com discussão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {comerciosComPublicacao}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Nova publicação</CardTitle>
          <CardDescription>
            A publicação usa o administrador da sessão como autor e aparece no
            fórum do comércio escolhido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NovaPublicacaoForm negocios={negociosPublicados} />
        </CardContent>
      </Card>

      <section aria-labelledby="publicacoes-recentes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="publicacoes-recentes"
              className="text-lg font-semibold text-ink"
            >
              Publicações recentes
            </h2>
            <p className="text-sm text-ink-soft">
              {totalPublicacoes === 0
                ? "Nenhuma publicação registrada."
                : `${totalPublicacoes} publicação(ões) registrada(s).`}
            </p>
          </div>
          {totalPublicacoes > publicacoes.length ? (
            <p className="text-xs text-ink-mute">
              Exibindo as {publicacoes.length} mais recentes.
            </p>
          ) : null}
        </div>

        {publicacoes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">
              Nenhuma publicação no fórum ainda.
            </p>
            <p className="mx-auto mt-1 max-w-lg text-sm text-ink-soft">
              Use o formulário acima para iniciar uma discussão sobre um
              comércio publicado. As publicações aparecem aqui com autor, tipo e
              data.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {publicacoes.map((publicacao) => {
              const tipoLabel = TIPO_LABELS[publicacao.tipo] ?? publicacao.tipo;
              const situacaoLabel =
                SITUACAO_PUBLICACAO_LABELS[
                  publicacao.negocio.situacaoPublicacao
                ] ?? publicacao.negocio.situacaoPublicacao;

              return (
                <li key={publicacao.id}>
                  <article className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">
                          {publicacao.autor?.nome ?? "Administrador removido"}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            TIPO_CLASSES[publicacao.tipo] ??
                            "border-line bg-surface-2 text-ink-soft"
                          }
                        >
                          {tipoLabel}
                        </Badge>
                        {publicacao.comentarioPaiId ? (
                          <Badge
                            variant="outline"
                            className="border-line bg-surface-2 text-ink-soft"
                          >
                            resposta
                          </Badge>
                        ) : null}
                      </div>
                      <time
                        dateTime={publicacao.criadaEm.toISOString()}
                        className="text-xs text-ink-mute"
                      >
                        {formatadorDataHora.format(publicacao.criadaEm)}
                      </time>
                    </div>

                    <p className="mt-3 text-sm break-words whitespace-pre-wrap text-ink">
                      {publicacao.conteudo}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3 text-xs text-ink-soft">
                      <span className="text-ink-mute">Comércio:</span>
                      <Link
                        href={`/admin/negocios/${publicacao.negocioId}`}
                        className="inline-flex min-h-10 items-center font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                      >
                        {publicacao.negocio.nome}
                      </Link>
                      <Badge
                        variant="outline"
                        className={
                          SITUACAO_PUBLICACAO_CLASSES[
                            publicacao.negocio.situacaoPublicacao
                          ] ?? "border-line bg-surface-2 text-ink-soft"
                        }
                      >
                        {situacaoLabel}
                      </Badge>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
