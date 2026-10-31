// src/ui/components/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Tag,
  FileText,
  Settings,
  MessageSquare,
  Vote,
  Image,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/components/button";
import { Simbolo } from "@/ui/components/brand/simbolo";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  restrito?: boolean;
};

const navigation: NavItem[] = [
  { name: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { name: "Solicitações", href: "/admin/solicitacoes", icon: FileText },
  { name: "Comércios", href: "/admin/negocios", icon: Building2 },
  { name: "Categorias", href: "/admin/categorias", icon: Tag },
  { name: "Fórum", href: "/admin/forum", icon: MessageSquare, restrito: true },
  { name: "Votações", href: "/admin/votacoes", icon: Vote, restrito: true },
  { name: "Imagens", href: "/admin/imagens", icon: Image },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function Sidebar({ admin }: { admin: { nome: string; email: string } }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-sidebar-border px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            aria-label="GuiaBG — painel administrativo"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-on-brand">
              <Simbolo className="h-5 w-auto" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                Guia<span className="text-sidebar-ring">BG</span>
              </span>
              <span className="block text-[0.625rem] font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase">
                Admin
              </span>
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-10 w-10 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-sidebar-ring",
            collapsed && "mx-auto",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navegação */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Menu principal"
      >
        <ul className="space-y-1" role="list">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand"
                    />
                  ) : null}
                  <item.icon
                    className="h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.restrito ? (
                    <span className="ml-auto rounded-full border border-sidebar-border px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.08em] text-sidebar-foreground/60 uppercase">
                      restrito
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Usuário e saída */}
      <div
        className={cn(
          "border-t border-sidebar-border p-3",
          collapsed && "flex justify-center",
        )}
      >
        {!collapsed ? (
          <div className="space-y-2">
            <div className="rounded-lg bg-sidebar-accent px-3 py-2">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {admin.nome}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {admin.email}
              </p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-10 w-full justify-start gap-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-sidebar-ring"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sair</span>
              </Button>
            </form>
          </div>
        ) : (
          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="mx-auto h-10 w-10 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-sidebar-ring"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        )}
      </div>
    </aside>
  );
}
