"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/ui/components/button";

/**
 * Alternador de tema.
 *
 * `resolvedTheme` é `undefined` até o cliente montar; usar isso como sinal de
 * "montado" evita divergência de hidratação sem um segundo estado sincronizado
 * por efeito (que dispara render em cascata).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = resolvedTheme !== undefined;
  const escuro = montado && resolvedTheme === "dark";

  const rotulo = !montado
    ? "Alternar tema"
    : escuro
      ? "Ativar tema claro"
      : "Ativar tema escuro";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={rotulo}
      title={rotulo}
      suppressHydrationWarning
    >
      {escuro ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </Button>
  );
}
