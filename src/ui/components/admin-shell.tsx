"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/ui/components/sidebar";
import { Header } from "@/ui/components/header";

/**
 * Casca do painel: guarda o estado do menu mobile.
 *
 * Sidebar e Header eram componentes independentes e o botão "abrir menu" do
 * header não fazia nada — no celular o menu nem aparecia. Agora um único
 * estado controla os dois.
 */
export function AdminShell({
  admin,
  children,
  contadores,
}: {
  admin: { nome: string; email: string };
  children: React.ReactNode;
  /** Itens da fila por rota — a sidebar mostra o número. */
  contadores?: Record<string, number>;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [menuAberto]);

  return (
    <div className="min-h-screen bg-canvas">
      {menuAberto ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-40 bg-[var(--ink)]/40 lg:hidden"
        />
      ) : null}

      <Sidebar
        admin={admin}
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        contadores={contadores}
      />

      <div className="lg:pl-64">
        <Header admin={admin} aoAbrirMenu={() => setMenuAberto(true)} />
        <main
          id="conteudo-admin"
          className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
