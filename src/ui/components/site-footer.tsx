import Link from "next/link";
import { Simbolo } from "@/ui/components/brand/simbolo";

const GUIA = [
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/catalogo#categorias", rotulo: "Categorias" },
  { href: "/solicitar", rotulo: "Participar do guia" },
];

const ADMINISTRACAO = [
  { href: "/login", rotulo: "Entrar" },
  { href: "/admin", rotulo: "Painel" },
];

const LEGAL = [
  { href: "/termos", rotulo: "Termos de uso" },
  { href: "/privacidade", rotulo: "Privacidade" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#1c1618] text-[#f7eff0]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Simbolo className="h-9 w-auto text-[#ff6b80]" />
            <span className="font-[family-name:var(--font-fraunces)] text-[1.3rem] font-semibold">
              GuiaBG
            </span>
          </div>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-[#c9b8bb]">
            Guia comunitário de comércios e serviços de Bento Gonçalves. Feito
            pela comunidade, para a comunidade.
          </p>
        </div>

        <nav aria-label="Links do guia">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9c878b]">
            O guia
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {GUIA.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-[#f7eff0] underline-offset-4 hover:text-[#ff8fa0] hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Administração">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9c878b]">
            Administração
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {ADMINISTRACAO.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-[#f7eff0] underline-offset-4 hover:text-[#ff8fa0] hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informações legais">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9c878b]">
            Legal
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-[#f7eff0] underline-offset-4 hover:text-[#ff8fa0] hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-[#332629]">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-[#9c878b] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} GuiaBG. Conteúdo enviado pela
            comunidade.
          </p>
          <p>Bento Gonçalves · Serra Gaúcha</p>
        </div>
      </div>
    </footer>
  );
}
