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

export default function AdminHomePage() {
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
