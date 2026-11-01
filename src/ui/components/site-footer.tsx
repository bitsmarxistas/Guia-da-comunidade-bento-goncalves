import Link from "next/link";
import { Simbolo } from "@/ui/components/brand/simbolo";

const GUIA = [
  { href: "/catalogo", rotulo: "Catálogo" },
  { href: "/#categorias", rotulo: "Categorias" },
  { href: "/termos", rotulo: "Política de dados" },
  { href: "/solicitar", rotulo: "Participar do guia" },
];

/*
 * O guia é público: visitante não tem conta e nada exige login. O rodapé só
 * aponta para o painel, que é da equipe — o link "Entrar" saiu daqui para não
 * sugerir que é preciso entrar para usar o site.
 */
const ADMINISTRACAO = [{ href: "/admin", rotulo: "Painel da equipe" }];

const LEGAL = [
  { href: "/termos", rotulo: "Termos de uso" },
  { href: "/privacidade", rotulo: "Privacidade" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-footer text-footer-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Simbolo className="h-9 w-auto text-footer-brand" />
            <span className="font-[family-name:var(--font-fraunces)] text-[1.3rem] font-semibold">
              GuiaBG
            </span>
          </div>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-footer-muted">
            Guia comunitário de comércios e serviços de Bento Gonçalves. Feito
            pela comunidade, para a comunidade.
          </p>
        </div>

        <nav aria-label="Links do guia">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-footer-muted">
            O guia
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {GUIA.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-footer-foreground underline-offset-4 hover:text-footer-hover hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Administração">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-footer-muted">
            Administração
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {ADMINISTRACAO.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-footer-foreground underline-offset-4 hover:text-footer-hover hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informações legais">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-footer-muted">
            Legal
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-footer-foreground underline-offset-4 hover:text-footer-hover hover:underline"
                  href={link.href}
                >
                  {link.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-footer-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} GuiaBG. Conteúdo enviado pela
            comunidade.
          </p>
          <p className="flex flex-wrap items-center gap-3">
            <span>Bento Gonçalves · Serra Gaúcha</span>
            <a
              href="https://github.com/bitsmarxistas/Guia-da-comunidade-bento-goncalves"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-footer-hover hover:underline"
            >
              Código aberto
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
