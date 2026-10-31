// src/app/(admin)/admin/forum/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default async function ForumPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fórum"
        description="Gerenciar publicações e discussões do fórum. Área restrita à administração."
        restrito
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total de publicações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Contestações ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Votações em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">0</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="publicacoes-recentes" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="publicacoes-recentes"
            className="text-lg font-semibold text-ink"
          >
            Publicações recentes
          </h2>
          <Button variant="outline" size="sm" className="h-10">
            Nova publicação
          </Button>
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-6 text-center text-sm text-ink-mute">
          Nenhuma publicação encontrada
        </div>
      </section>
    </div>
  );
}
