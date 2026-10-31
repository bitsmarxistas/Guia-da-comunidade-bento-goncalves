import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Building2,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Tag,
  Vote,
} from "lucide-react";
import { AdminPageHeader, RestritoBadge } from "../_components/admin-shared";
import { cn } from "@/lib/utils";
import { db } from "@/infrastructure/db/client";
import {
  imagem,
  negocio,
  solicitacao,
  votacao,
} from "@/infrastructure/db/schema";
import { eq, ne } from "drizzle-orm";

type Atalho = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  restrito?: boolean;
};

const atalhos: Atalho[] = [
  {
    title: "Solicitações",
    description: "Analisar pedidos de inclusão e atualização.",
    href: "/admin/solicitacoes",
    icon: FileText,
  },
  {
    title: "Comércios",
    description: "Gerenciar os comércios já cadastrados.",
    href: "/admin/negocios",
    icon: Building2,
  },
  {
    title: "Categorias",
    description: "Organizar as categorias do catálogo.",
    href: "/admin/categorias",
    icon: Tag,
  },
  {
    title: "Fórum",
    description: "Publicações e discussões da comunidade.",
    href: "/admin/forum",
    icon: MessageSquare,
    restrito: true,
  },
  {
    title: "Votações",
    description: "Acompanhar votações ativas e finalizadas.",
    href: "/admin/votacoes",
    icon: Vote,
    restrito: true,
  },
  {
    title: "Imagens",
    description: "Moderar imagens enviadas por solicitantes.",
    href: "/admin/imagens",
    icon: ImageIcon,
  },
  {
    title: "Configurações",
    description: "Ajustar dados institucionais e limites.",
    href: "/admin/configuracoes",
    icon: Settings,
  },
];

/**
 * Números reais do guia.
 *
 * O painel só tinha atalhos: nenhum indicador do que estava esperando decisão.
 * As contagens vêm do banco a cada visita (o layout do admin já é dinâmico).
 */
async function carregarIndicadores() {
  const [
    recebidas,
    emAnalise,
    emVotacao,
    imagensPendentes,
    publicados,
    naoPublicados,
  ] = await Promise.all([
    db.$count(solicitacao, eq(solicitacao.situacao, "recebida")),
    db.$count(solicitacao, eq(solicitacao.situacao, "em_analise")),
    db.$count(votacao, eq(votacao.situacao, "em_andamento")),
    db.$count(imagem, eq(imagem.situacao, "pendente")),
    db.$count(negocio, eq(negocio.situacaoPublicacao, "publicado")),
    db.$count(negocio, ne(negocio.situacaoPublicacao, "publicado")),
  ]);

  return {
    recebidas,
    emAnalise,
    emVotacao,
    imagensPendentes,
    publicados,
    naoPublicados,
  };
}

export default async function AdminHomePage() {
  const indicadores = await carregarIndicadores();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Painel administrativo"
        description="Visão geral do GuiaBG. Escolha uma área para continuar."
      >
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Ver site
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </AdminPageHeader>

      <section aria-labelledby="situacao-admin" className="space-y-3">
        <h2 id="situacao-admin" className="text-lg font-semibold text-ink">
          Situação agora
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              rotulo: "Solicitações recebidas",
              valor: indicadores.recebidas,
              href: "/admin/solicitacoes?situacao=recebida",
              destaque: indicadores.recebidas > 0,
            },
            {
              rotulo: "Em análise",
              valor: indicadores.emAnalise,
              href: "/admin/solicitacoes?situacao=em_analise",
              destaque: indicadores.emAnalise > 0,
            },
            {
              rotulo: "Votações em andamento",
              valor: indicadores.emVotacao,
              href: "/admin/votacoes",
              destaque: indicadores.emVotacao > 0,
            },
            {
              rotulo: "Imagens para moderar",
              valor: indicadores.imagensPendentes,
              href: "/admin/imagens",
              destaque: indicadores.imagensPendentes > 0,
            },
            {
              rotulo: "Comércios publicados",
              valor: indicadores.publicados,
              href: "/admin/negocios",
              destaque: false,
            },
            {
              rotulo: "Fora do ar",
              valor: indicadores.naoPublicados,
              href: "/admin/negocios",
              destaque: false,
            },
          ].map((item) => (
            <li key={item.rotulo}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-20 items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  item.destaque
                    ? "border-brand/40 hover:border-brand"
                    : "border-line hover:border-line-strong",
                )}
              >
                <span className="text-sm font-medium text-ink-soft">
                  {item.rotulo}
                </span>
                <span
                  className={cn(
                    "font-[family-name:var(--font-fraunces)] text-2xl font-semibold tabular",
                    item.destaque ? "text-brand" : "text-ink",
                  )}
                >
                  {item.valor}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="atalhos-admin" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2
            id="atalhos-admin"
            className="flex items-center gap-2 text-lg font-semibold text-ink"
          >
            <LayoutDashboard
              className="h-5 w-5 text-ink-mute"
              aria-hidden="true"
            />
            Atalhos
          </h2>
          <p className="text-sm text-ink-soft">
            Fórum e Votações são restritos à administração.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {atalhos.map((atalho) => {
            const Icone = atalho.icon;
            return (
              <Link
                key={atalho.href}
                href={atalho.href}
                className={cn(
                  "group flex min-h-32 flex-col justify-between rounded-xl border border-line bg-surface p-4 transition-colors",
                  "hover:border-line-strong hover:bg-surface-2",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <Icone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {atalho.restrito ? (
                    <RestritoBadge />
                  ) : (
                    <ArrowUpRight
                      className="h-4 w-4 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span>
                  <span className="mt-4 block font-heading text-base font-medium text-ink">
                    {atalho.title}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">
                    {atalho.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
