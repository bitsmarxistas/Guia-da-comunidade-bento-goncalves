// src/app/(admin)/admin/votacoes/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default async function VotacoesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Votações"
        description="Acompanhar votações ativas e finalizadas. Área restrita à administração."
        restrito
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Votações ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Em apuração</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="votacoes-recentes" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="votacoes-recentes" className="text-lg font-semibold text-ink">
            Votações recentes
          </h2>
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-6 text-center text-sm text-ink-mute">
          Nenhuma votação encontrada
        </div>
      </section>
    </div>
  );
}
