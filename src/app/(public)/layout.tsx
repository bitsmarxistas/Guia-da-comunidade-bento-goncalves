import { getAdmin } from "@/lib/auth";
import { HeaderNav } from "@/ui/components/header-nav";
import { SiteFooter } from "@/ui/components/site-footer";

/**
 * Shell público único (§5.1): header sticky, rodapé escuro e link de pulo.
 * Nenhuma página pública monta header/footer por conta própria.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-brand px-4 py-3 font-semibold text-on-brand focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <HeaderNav logado={Boolean(admin)} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
