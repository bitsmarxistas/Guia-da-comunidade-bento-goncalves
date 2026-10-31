"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/ui/components/button";

/**
 * Alternador de tema.
 *
 * O ícone certo é escolhido por CSS a partir de `[data-theme]` no <html>, e a
 * direção do clique vem do próprio DOM. Isso evita dois problemas que já
 * apareceram aqui: divergência de hidratação (servidor não sabe o tema) e
 * `resolvedTheme` indefinido, que deixava o ícone errado para sempre.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  const alternar = () => {
    const escuro =
      document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(escuro ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={alternar}
      aria-label="Alternar tema"
      title="Alternar tema claro/escuro"
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  );
}
