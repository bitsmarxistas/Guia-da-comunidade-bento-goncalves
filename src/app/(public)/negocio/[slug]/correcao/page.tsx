import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { categoria } from "@/infrastructure/db/schema/categoria";
import { buscarNegocioPorSlug } from "@/application/negocios/listar";
import { CorrecaoForm } from "./_components/correcao-form";

export const metadata: Metadata = {
  title: "Pedir correção",
  description:
    "Corrija informações de um comércio do GuiaBG. A correção passa por análise antes de ser publicada.",
  robots: { index: false, follow: true },
};

export default async function CorrecaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const negocio = await buscarNegocioPorSlug(slug);
  if (!negocio) notFound();

  const categorias = await db
    .select({ id: categoria.id, nome: categoria.nome })
    .from(categoria)
    .where(eq(categoria.ativa, true))
    .orderBy(asc(categoria.nome));

  const whatsapp =
    negocio.contatos.find((contato) => contato.tipo === "whatsapp")?.valor ??
    "";

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-3xl py-10 md:py-14">
        <nav aria-label="Você está aqui" className="text-sm text-ink-mute">
          <Link href={`/negocio/${slug}`} className="hover:text-brand">
            {negocio.nome}
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-ink">Correção</span>
        </nav>

        <header className="mt-4">
          <p className="eyebrow">Pedir correção</p>
          <h1 className="h1-editorial mt-3">
            Corrigir dados de {negocio.nome}
          </h1>
          <p className="mt-3 text-ink-soft">
            Preencha os dados corretos. A correção é analisada pela equipe e só
            aparece no guia depois de aprovada — em até 24 h, com resposta por
            e-mail.
          </p>
        </header>

        <div className="mt-8">
          <CorrecaoForm
            dados={{
              negocioId: negocio.id,
              nome: negocio.nome,
              descricao: negocio.descricao,
              whatsapp,
              bairro: negocio.localizacao?.bairro ?? "",
              endereco: negocio.localizacao?.endereco ?? "",
              categorias,
              categoriasIds: negocio.categorias
                .map((vinculo) => vinculo.categoriaId)
                .filter(Boolean),
            }}
          />
        </div>
      </div>
    </div>
  );
}
