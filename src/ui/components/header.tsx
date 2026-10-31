// src/ui/components/header.tsx
"use client";

import Link from "next/link";
import { Menu, FileText, User } from "lucide-react";
import { Button } from "@/ui/components/button";
import { ThemeToggle } from "@/ui/components/theme-toggle";

interface HeaderProps {
  admin: {
    nome: string;
    email: string;
  };
  /** Abre o drawer do menu no mobile (o estado vive no AdminShell). */
  aoAbrirMenu?: () => void;
}

/**
 * Barra superior do painel.
 *
 * Antes havia três controles mortos (menu sem handler, sino e avatar sem ação)
 * e um campo de busca que não buscava nada. Agora cada controle leva a algum
 * lugar real: o menu abre o drawer, a busca vai para a lista de solicitações,
 * o sino leva à fila de análise e o avatar abre as configurações.
 */
export function Header({ admin, aoAbrirMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-[2px]">
      <div className="flex h-14 items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={aoAbrirMenu}
          className="lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={false}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <form
          action="/admin/solicitacoes"
          method="get"
          role="search"
          className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md"
        >
          <label htmlFor="busca-painel" className="sr-only">
            Buscar solicitação por comércio, solicitante ou protocolo
          </label>
          <FileText
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
            aria-hidden="true"
          />
          <input
            id="busca-painel"
            type="search"
            name="busca"
            placeholder="Buscar por comércio, e-mail ou protocolo…"
            className="h-10 w-full rounded-[10px] border border-line bg-surface-2 pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-ink-mute focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          <Button variant="ghost" size="icon" asChild>
            <Link
              href="/admin/solicitacoes?situacao=recebida"
              aria-label="Solicitações aguardando análise"
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          <Button variant="ghost" className="gap-2 pr-3 pl-3" asChild>
            <Link
              href="/admin/configuracoes"
              aria-label={`Configurações da conta de ${admin.nome}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-brand">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden text-sm font-medium text-ink-soft md:block">
                {admin.nome}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
