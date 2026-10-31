import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { categoria } from "@/infrastructure/db/schema/categoria";
import { buscarNegocioPorSlugId } from "./_components/consultar";
import { NegocioForm } from "../_components/negocio-form";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { BotaoPublicacao } from "./_components/botao-publicacao";

export default async function EditarNegocioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const negocio = await buscarNegocioPorSlugId(id);
  if (!negocio) notFound();

  const categorias = await db
    .select({ id: categoria.id, nome: categoria.nome })
    .from(categoria)
    .where(eq(categoria.ativa, true))
    .orderBy(asc(categoria.nome));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editar: ${negocio.nome}`}
        description={`Situação atual: ${negocio.situacaoPublicacao} · /negocio/${negocio.slug}`}
      >
        <BotaoPublicacao
          id={negocio.id}
          publicado={negocio.situacaoPublicacao === "publicado"}
        />
      </AdminPageHeader>

      <div className="max-w-3xl rounded-[14px] border border-line bg-surface p-5">
        <NegocioForm
          categorias={categorias}
          negocio={{
            id: negocio.id,
            nome: negocio.nome,
            descricao: negocio.descricao,
            contatos: negocio.contatos,
            localizacao: negocio.localizacao,
            horarios: negocio.horarios,
            categoriasIds: negocio.categorias.map((c) => c.categoriaId),
          }}
        />
      </div>
    </div>
  );
}
