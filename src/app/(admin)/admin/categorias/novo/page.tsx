import { CategoriaForm } from "../_components/categoria-form";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default function NovaCategoriaPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nova categoria"
        description="Crie uma categoria do catálogo. Ela entra ativa e visível."
      />
      <div className="max-w-2xl rounded-[14px] border border-line bg-surface p-5">
        <CategoriaForm />
      </div>
    </div>
  );
}
