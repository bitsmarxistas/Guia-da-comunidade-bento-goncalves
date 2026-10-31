// src/ui/components/header.tsx
"use client";

import { Menu, Bell, Search, User, Sun, Moon } from "lucide-react";
import { Button } from "@/ui/components/button";
import { useTheme } from "next-themes";

interface HeaderProps {
  admin: {
    nome: string;
    email: string;
  };
}

export function Header({ admin }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95">
      <div className="flex h-14 items-center gap-2 px-4 sm:gap-4 sm:px-6">
        {/* Menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Busca */}
        <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar no painel..."
            aria-label="Buscar no painel"
            className="h-10 w-full rounded-lg border border-line bg-surface-2 pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-ink-mute focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
          />
        </div>

        {/* Ações */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            className="gap-2 pr-3 pl-3"
            aria-label="Menu do usuário"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-brand">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-medium text-ink-soft md:block">
              {admin.nome}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
