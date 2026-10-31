import { asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { categoria } from "@/infrastructure/db/schema/categoria";
import { NegocioForm } from "../_components/negocio-form";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default async function NovoNegocioPage() {
  const categorias = await db
    .select({ id: categoria.id, nome: categoria.nome })
    .from(categoria)
    .where(eq(categoria.ativa, true))
    .orderBy(asc(categoria.nome));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Novo comércio"
        description="Cadastro direto pela administração. Nasce publicado."
      />
      <div className="max-w-3xl rounded-[14px] border border-line bg-surface p-5">
        <NegocioForm categorias={categorias} />
      </div>
    </div>
  );
}
