import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { categoria } from "@/infrastructure/db/schema/categoria";
import { CategoriaForm } from "../_components/categoria-form";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { BotaoStatusCategoria } from "./_components/botao-status";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [registro] = await db
    .select()
    .from(categoria)
    .where(eq(categoria.id, id))
    .limit(1);

  if (!registro) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editar: ${registro.nome}`}
        description={`Slug público: /catalogo?categoria=${registro.slug}`}
      >
        <BotaoStatusCategoria id={registro.id} ativa={registro.ativa} />
      </AdminPageHeader>

      <div className="max-w-2xl rounded-[14px] border border-line bg-surface p-5">
        <CategoriaForm
          categoria={{
            id: registro.id,
            nome: registro.nome,
            descricao: registro.descricao,
            oculta: registro.oculta,
            ativa: registro.ativa,
          }}
        />
      </div>
    </div>
  );
}
