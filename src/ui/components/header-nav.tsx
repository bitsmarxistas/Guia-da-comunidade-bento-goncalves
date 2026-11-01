"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Simbolo } from "@/ui/components/brand/simbolo";
import { ThemeToggle } from "@/ui/components/theme-toggle";

const LINKS = [
  { href: "/", rotulo: "Início" },
  { href: "/catalogo", rotulo: "Descobrir" },
  // O bloco de categorias vive na home; antes apontava para /catalogo#categorias,
  // âncora que não existia nessa página.
  { href: "/#categorias", rotulo: "Categorias" },
];

export function HeaderNav({ logado }: { logado: boolean }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const painelRef = useRef<HTMLDivElement>(null);

  // Esc fecha e devolve foco ao gatilho
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAberto(false);
        document.getElementById("botao-menu")?.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-[2px]">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg"
          aria-label="GuiaBG — página inicial"
        >
          <Simbolo className="h-8 w-auto text-brand" />
          <span className="font-[family-name:var(--font-fraunces)] text-[1.3rem] font-semibold tracking-tight text-ink">
            Guia<span className="text-brand">BG</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => {
              const semHash = link.href.split("#")[0] ?? "";
              const ativo = link.href.includes("#")
                ? false
                : semHash === "/"
                  ? pathname === "/"
                  : pathname.startsWith(semHash);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={ativo ? "page" : undefined}
                    className={[
                      "inline-flex h-11 items-center rounded-[10px] px-3 text-sm font-semibold transition-colors",
                      ativo
                        ? "text-brand"
                        : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                    ].join(" ")}
                  >
                    {link.rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/busca" aria-label="Buscar no guia">
              <Search className="size-5" aria-hidden="true" />
            </Link>
          </Button>

          <ThemeToggle />

          {/* Visitante não vê "Entrar": o guia não pede conta. O atalho para o
              painel só aparece para quem já está autenticado. */}
          {logado ? (
            <Link
              href="/admin"
              className="hidden h-11 items-center rounded-[10px] px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink sm:inline-flex"
            >
              Painel
            </Link>
          ) : null}

          <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
            <Link href="/solicitar">Participar</Link>
          </Button>

          <Button
            id="botao-menu"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setAberto((valor) => !valor)}
          >
            {aberto ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {aberto ? (
        <div
          id="menu-mobile"
          ref={painelRef}
          className="border-t border-line bg-surface md:hidden"
        >
          <nav
            aria-label="Navegação principal (mobile)"
            className="container-page py-2"
          >
            <ul className="flex flex-col">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setAberto(false)}
                    className="flex min-h-12 items-center rounded-[10px] px-2 text-base font-semibold text-ink hover:bg-surface-2"
                  >
                    {link.rotulo}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/busca"
                  onClick={() => setAberto(false)}
                  className="flex min-h-12 items-center rounded-[10px] px-2 text-base font-semibold text-ink hover:bg-surface-2"
                >
                  Buscar
                </Link>
              </li>
              {logado ? (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setAberto(false)}
                    className="flex min-h-12 items-center rounded-[10px] px-2 text-base font-semibold text-ink hover:bg-surface-2"
                  >
                    Painel
                  </Link>
                </li>
              ) : null}
              <li className="px-2 pt-2 pb-3">
                <Button asChild className="w-full">
                  <Link href="/solicitar" onClick={() => setAberto(false)}>
                    Participar
                  </Link>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
