// src/app/(admin)/admin/votacoes/page.tsx
import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { votacao as votacaoTable } from "@/infrastructure/db/schema";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { AbrirVotacaoForm } from "./_components/abrir-votacao-form";
import { ApurarVotacaoForm } from "./_components/apurar-votacao-form";
import { ChevronDown } from "lucide-react";

const SITUACAO_VOTACAO: Record<string, { label: string; className: string }> = {
  em_andamento: {
    label: "Em andamento",
    className: "border-warning/30 bg-warning-tint text-warning",
  },
  aprovada: {
    label: "Aprovada",
    className: "border-positive/30 bg-positive-tint text-positive",
  },
  rejeitada: {
    label: "Rejeitada",
    className: "border-critical/30 bg-critical-tint text-critical",
  },
  sem_aprovacao: {
    label: "Sem aprovação",
    className: "border-line bg-surface-2 text-ink-soft",
  },
};

const ESCOLHA: Record<string, { label: string; className: string }> = {
  aprovacao: {
    label: "Aprovação",
    className: "border-positive/30 bg-positive-tint text-positive",
  },
  rejeicao: {
    label: "Rejeição",
    className: "border-critical/30 bg-critical-tint text-critical",
  },
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function VotacoesPage() {
  const [votacoes, contestacoesAbertas, adminsAtivos, contagens] =
    await Promise.all([
      db.query.votacao.findMany({
        orderBy: (votacao, { desc }) => [desc(votacao.iniciadaEm)],
        limit: 100,
        extras: {
          // Comparação de prazo feita no banco: Date.now() no render violaria
          // react-hooks/purity.
          prazoVencido: sql<boolean>`${votacaoTable.encerraEm} < now()`.as(
            "prazo_vencido",
          ),
        },
        with: {
          contestacao: {
            with: {
              negocio: { columns: { id: true, nome: true, slug: true } },
              autor: { columns: { id: true, nome: true } },
            },
          },
          votos: {
            orderBy: (voto, { asc }) => [asc(voto.criadoEm)],
            with: {
              autor: { columns: { id: true, nome: true } },
            },
          },
        },
      }),
      db.query.contestacao.findMany({
        where: (contestacao, { eq }) => eq(contestacao.situacao, "aberta"),
        orderBy: (contestacao, { desc }) => [desc(contestacao.criadaEm)],
        with: {
          negocio: { columns: { id: true, nome: true } },
          autor: { columns: { id: true, nome: true, ativo: true } },
        },
      }),
      db.query.administrador.findMany({
        where: (admin, { eq }) => eq(admin.ativo, true),
        columns: { id: true, nome: true },
        orderBy: (admin, { asc }) => [asc(admin.nome)],
      }),
      db
        .select({ situacao: votacaoTable.situacao, total: count() })
        .from(votacaoTable)
        .groupBy(votacaoTable.situacao),
    ]);

  const contagemPorSituacao = new Map(
    contagens.map((linha) => [linha.situacao, linha.total]),
  );

  const emAndamento = contagemPorSituacao.get("em_andamento") ?? 0;
  const aprovadas = contagemPorSituacao.get("aprovada") ?? 0;
  const rejeitadasOuSemAprovacao =
    (contagemPorSituacao.get("rejeitada") ?? 0) +
    (contagemPorSituacao.get("sem_aprovacao") ?? 0);

  const contestacoesDisponiveis = contestacoesAbertas
    .filter((contestacao) => contestacao.autor?.ativo)
    .map((contestacao) => ({
      id: contestacao.id,
      rotulo: `${contestacao.negocio?.nome ?? "Comércio"} — ${contestacao.autor?.nome ?? "autor"} — ${formatadorDataHora.format(contestacao.criadaEm)}`,
    }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Votações"
        description="Abrir, acompanhar e apurar as votações de contestação. Área restrita à administração."
        restrito
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {emAndamento}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {aprovadas}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Rejeitadas ou sem aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {rejeitadasOuSemAprovacao}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Abrir votação</CardTitle>
          <CardDescription>
            Só contestações oficiais com situação &quot;aberta&quot; e autor
            ativo podem gerar votação. O quórum é congelado na abertura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AbrirVotacaoForm contestacoes={contestacoesDisponiveis} />
        </CardContent>
      </Card>

      <section aria-labelledby="votacoes-recentes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="votacoes-recentes"
              className="text-lg font-semibold text-ink"
            >
              Votações recentes
            </h2>
            <p className="text-sm text-ink-soft">
              {votacoes.length === 0
                ? "Nenhuma votação registrada."
                : `${votacoes.length} votação(ões) listada(s).`}
            </p>
          </div>
          {contestacoesAbertas.length > 0 &&
          contestacoesDisponiveis.length < contestacoesAbertas.length ? (
            <p className="text-xs text-ink-mute">
              {contestacoesAbertas.length - contestacoesDisponiveis.length}{" "}
              contestação(ões) aberta(s) sem autor ativo não aparece(m) no
              formulário.
            </p>
          ) : null}
        </div>

        {votacoes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">
              Nenhuma votação foi aberta ainda.
            </p>
            <p className="mx-auto mt-1 max-w-lg text-sm text-ink-soft">
              Assim que uma contestação oficial estiver aberta, ela aparece no
              formulário acima para gerar a primeira votação.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {votacoes.map((votacao) => {
              const situacao = SITUACAO_VOTACAO[votacao.situacao] ?? {
                label: votacao.situacao,
                className: "border-line bg-surface-2 text-ink-soft",
              };
              const votos = votacao.votos ?? [];
              const votosSim = votos.filter(
                (voto) => voto.escolha === "aprovacao",
              ).length;
              const votosNao = votos.filter(
                (voto) => voto.escolha === "rejeicao",
              ).length;
              const emAberto = votacao.situacao === "em_andamento";
              const faltam = Math.max(0, votacao.quorumMinimo - votos.length);
              const prazoVencido = emAberto && votacao.prazoVencido;
              const votaram = new Set(votos.map((voto) => voto.adminId));
              const naoVotaram = adminsAtivos.filter(
                (admin) => !votaram.has(admin.id),
              );
              const negocio = votacao.contestacao?.negocio;
              const autorContestacao = votacao.contestacao?.autor;

              return (
                <li key={votacao.id}>
                  <Card size="sm">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={situacao.className}
                            >
                              {situacao.label}
                            </Badge>
                            {prazoVencido ? (
                              <Badge
                                variant="outline"
                                className="border-critical/30 bg-critical-tint text-critical"
                              >
                                prazo vencido
                              </Badge>
                            ) : null}
                            <span className="text-xs text-ink-mute">
                              quórum de {votacao.quorumMinimo}
                            </span>
                          </div>
                          <CardTitle className="text-base text-ink">
                            {votacao.pergunta}
                          </CardTitle>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                            <span>Contestação sobre</span>
                            {negocio ? (
                              <Link
                                href={`/admin/negocios/${negocio.id}`}
                                className="inline-flex min-h-10 items-center font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                              >
                                {negocio.nome}
                              </Link>
                            ) : (
                              <span className="font-medium text-ink">
                                comércio não encontrado
                              </span>
                            )}
                            <span>
                              aberta por{" "}
                              {autorContestacao?.nome ??
                                "administrador removido"}
                            </span>
                          </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft">
                          <dt className="text-ink-mute">Iniciada</dt>
                          <dd>
                            {formatadorDataHora.format(votacao.iniciadaEm)}
                          </dd>
                          <dt className="text-ink-mute">Encerra</dt>
                          <dd>
                            {formatadorDataHora.format(votacao.encerraEm)}
                          </dd>
                          {votacao.encerradaEm ? (
                            <>
                              <dt className="text-ink-mute">Encerrada</dt>
                              <dd>
                                {formatadorDataHora.format(votacao.encerradaEm)}
                              </dd>
                            </>
                          ) : null}
                        </dl>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <dl className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                          <dt className="text-xs text-ink-mute">
                            Votos registrados
                          </dt>
                          <dd className="text-lg font-semibold text-ink tabular-nums">
                            {votos.length}
                            <span className="text-sm font-normal text-ink-soft">
                              {" "}
                              de {votacao.quorumMinimo} do quórum
                            </span>
                          </dd>
                        </div>
                        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                          <dt className="text-xs text-ink-mute">Aprovação</dt>
                          <dd className="text-lg font-semibold text-ink tabular-nums">
                            {votosSim}
                          </dd>
                        </div>
                        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                          <dt className="text-xs text-ink-mute">Rejeição</dt>
                          <dd className="text-lg font-semibold text-ink tabular-nums">
                            {votosNao}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                        {emAberto ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <ApurarVotacaoForm votacaoId={votacao.id} />
                            {faltam > 0 ? (
                              <p className="text-sm text-ink-soft">
                                Faltam {faltam} voto(s) para completar o quórum
                                de {votacao.quorumMinimo}.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-sm text-ink-soft">
                            Votação encerrada com resultado{" "}
                            <strong className="font-medium text-ink">
                              {votacao.resultado
                                ? (SITUACAO_VOTACAO[votacao.resultado]?.label ??
                                  votacao.resultado)
                                : situacao.label}
                            </strong>
                            .
                          </p>
                        )}
                      </div>

                      <details className="group rounded-lg border border-line bg-surface-2/60">
                        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                          <ChevronDown
                            className="h-4 w-4 transition-transform group-open:rotate-180"
                            aria-hidden="true"
                          />
                          Detalhar votos
                        </summary>
                        <div className="space-y-3 border-t border-line px-3 py-3">
                          {votos.length === 0 ? (
                            <p className="text-sm text-ink-soft">
                              Nenhum voto registrado ainda.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {votos.map((voto) => {
                                const escolha = ESCOLHA[voto.escolha] ?? {
                                  label: voto.escolha,
                                  className:
                                    "border-line bg-surface-2 text-ink-soft",
                                };

                                return (
                                  <li
                                    key={voto.id}
                                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                                  >
                                    <span className="text-ink">
                                      {voto.autor?.nome ??
                                        "Administrador removido"}
                                    </span>
                                    <span className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={escolha.className}
                                      >
                                        {escolha.label}
                                      </Badge>
                                      <time
                                        dateTime={voto.criadoEm.toISOString()}
                                        className="text-xs text-ink-mute"
                                      >
                                        {formatadorDataHora.format(
                                          voto.criadoEm,
                                        )}
                                      </time>
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {emAberto && naoVotaram.length > 0 ? (
                            <p className="text-xs text-ink-soft">
                              Ainda não votaram:{" "}
                              {naoVotaram.map((admin) => admin.nome).join(", ")}
                              .
                            </p>
                          ) : null}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
