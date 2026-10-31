// src/app/(admin)/admin/administradores/page.tsx
import { redirect } from "next/navigation";
import { Lock, Pencil } from "lucide-react";
import { listarAdminsAction } from "@/application/governanca/admin";
import { getAdmin } from "@/lib/auth";
import { exigirContextoAdmin } from "@/lib/audit-context";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { EditarAdminForm } from "./_components/editar-admin-form";
import { NovoAdminForm } from "./_components/novo-admin-form";

/**
 * A página repete a constante de application/governanca/admin.ts para
 * decidir o que renderizar. A autorização de verdade é refeita em cada action.
 */
const ADMIN_RAIZ = "admin@guiabg.com.br";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function AdministradoresPage() {
  await exigirContextoAdmin();

  const ator = await getAdmin();
  if (!ator) redirect("/login");

  const ehAdminRaiz = ator.email.trim().toLowerCase() === ADMIN_RAIZ;

  if (!ehAdminRaiz) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Administradores"
          description="Gestão de contas administrativas. Área restrita ao administrador principal."
          restrito
        />

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink">
              <Lock className="h-5 w-5 text-ink-mute" aria-hidden="true" />
              Acesso restrito ao administrador principal
            </CardTitle>
            <CardDescription>
              Esta área não está disponível para a sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-soft">
              Somente o administrador principal
              {" ("}
              <span className="font-medium text-ink">{ADMIN_RAIZ}</span>
              {") "}
              pode visualizar, criar, editar ou suspender contas
              administrativas. Seu acesso atual é{" "}
              <span className="font-medium text-ink">{ator.email}</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resultado = await listarAdminsAction(null, new FormData());

  if ("error" in resultado) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Administradores"
          description="Gestão de contas administrativas."
          restrito
        />
        <div
          role="alert"
          className="rounded-xl border border-critical/30 bg-critical-tint p-4 text-sm text-critical"
        >
          Erro ao carregar administradores: {resultado.error}
        </div>
      </div>
    );
  }

  const admins = resultado.admins;
  const totalAtivos = admins.filter((admin) => admin.ativo).length;
  const totalSuspensos = admins.length - totalAtivos;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Administradores"
        description="Contas com acesso ao painel. Somente o administrador principal vê e altera esta área."
        restrito
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total de administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {admins.length}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {totalAtivos}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Suspensos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-ink tabular-nums">
              {totalSuspensos}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Novo administrador</CardTitle>
            <CardDescription>
              A conta é criada ativa, com senha em hash argon2 e tokenVersion 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NovoAdminForm />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Administradores cadastrados</CardTitle>
            <CardDescription>
              Nome, e-mail, situação e data de criação. Abra &quot;Editar&quot;
              para alterar dados ou redefinir a senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-8 text-center text-sm text-ink-soft">
                Nenhum administrador cadastrado.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {admins.map((admin) => {
                  const adminEhPrincipal = admin.email === ADMIN_RAIZ;

                  return (
                    <li key={admin.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-ink">{admin.nome}</p>
                            {adminEhPrincipal ? (
                              <Badge
                                variant="outline"
                                className="border-brand/30 bg-brand-tint text-brand-strong"
                              >
                                principal
                              </Badge>
                            ) : null}
                            {admin.id === ator.id ? (
                              <Badge
                                variant="outline"
                                className="border-line bg-surface-2 text-ink-soft"
                              >
                                você
                              </Badge>
                            ) : null}
                            <Badge
                              variant="outline"
                              className={
                                admin.ativo
                                  ? "border-positive/30 bg-positive-tint text-positive"
                                  : "border-critical/30 bg-critical-tint text-critical"
                              }
                            >
                              {admin.ativo ? "Ativo" : "Suspenso"}
                            </Badge>
                          </div>
                          <p className="text-sm break-all text-ink-soft">
                            {admin.email}
                          </p>
                          <p className="text-xs text-ink-mute">
                            Criado em {formatadorData.format(admin.criadoEm)}
                          </p>
                        </div>
                      </div>

                      <details className="group mt-2">
                        <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </summary>
                        <EditarAdminForm
                          admin={{
                            id: admin.id,
                            nome: admin.nome,
                            email: admin.email,
                            ativo: admin.ativo,
                          }}
                          ehAdminRaiz={adminEhPrincipal}
                        />
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
