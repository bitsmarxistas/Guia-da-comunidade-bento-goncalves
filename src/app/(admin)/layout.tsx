// src/app/(admin)/layout.tsx
import { AdminShell } from "@/ui/components/admin-shell";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { db } from "@/infrastructure/db/client";
import { imagem, solicitacao } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");

  // Números da fila no menu: antes o admin só descobria o que esperava
  // entrando em cada tela.
  const [solicitacoesPendentes, imagensPendentes] = await Promise.all([
    db.$count(solicitacao, eq(solicitacao.situacao, "recebida")),
    db.$count(imagem, eq(imagem.situacao, "pendente")),
  ]);

  return (
    <AdminShell
      admin={admin}
      contadores={{
        "/admin/solicitacoes": solicitacoesPendentes,
        "/admin/imagens": imagensPendentes,
      }}
    >
      <a
        href="#conteudo-admin"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-10 focus:items-center focus:rounded-lg focus:bg-brand focus:px-4 focus:text-sm focus:font-semibold focus:text-on-brand"
      >
        Pular para o conteúdo
      </a>
      {children}
    </AdminShell>
  );
}
