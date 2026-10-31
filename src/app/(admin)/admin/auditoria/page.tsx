// src/app/(admin)/admin/auditoria/page.tsx
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { listarAuditoriaAction } from "@/application/auditoria/listar";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NativeSelect } from "@/ui/components/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

const ADMIN_RAIZ = "admin@guiabg.com.br";

const ATORES = ["admin", "solicitante", "sistema", "desenvolvedor"];

export const dynamic = "force-dynamic";

/**
 * Auditoria (RF-062) — restrita ao administrador principal.
 *
 * Somente leitura: a tela existe para responder "quem mudou isso e quando".
 */
export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; atorTipo?: string; pagina?: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  if (admin.email !== ADMIN_RAIZ) redirect("/admin");

  const params = await searchParams;
  const formData = new FormData();
  if (params.acao) formData.append("acao", params.acao);
  if (params.atorTipo) formData.append("atorTipo", params.atorTipo);
  formData.append("pagina", params.pagina ?? "1");

  const resultado = await listarAuditoriaAction(null, formData);
  const { registros, total, pagina, totalPaginas, acoes } = resultado;

  const query = (extra: Record<string, string>) => {
    const search = new URLSearchParams();
    if (params.acao) search.set("acao", params.acao);
    if (params.atorTipo) search.set("atorTipo", params.atorTipo);
    for (const [chave, valor] of Object.entries(extra))
      search.set(chave, valor);
    const texto = search.toString();
    return texto ? `/admin/auditoria?${texto}` : "/admin/auditoria";
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auditoria"
        description="Trilha de tudo que a administração fez: quem, quando, o quê e sobre qual registro."
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="acao">Ação</Label>
              <NativeSelect
                id="acao"
                name="acao"
                defaultValue={params.acao ?? ""}
              >
                <option value="">Todas</option>
                {acoes.map((acao) => (
                  <option key={acao} value={acao}>
                    {acao}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="atorTipo">Quem</Label>
              <NativeSelect
                id="atorTipo"
                name="atorTipo"
                defaultValue={params.atorTipo ?? ""}
              >
                <option value="">Todos</option>
                {ATORES.map((ator) => (
                  <option key={ator} value={ator}>
                    {ator}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" size="sm" className="h-10">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Quem</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-ink-mute"
                    >
                      Nenhum registro com esses filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="whitespace-nowrap text-ink-soft">
                        {new Date(registro.criadoEm).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-ink">
                        {registro.atorTipo}
                        {registro.atorId ? (
                          <span className="block font-mono text-xs text-ink-mute">
                            {registro.atorId.slice(0, 8)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium text-ink">
                        {registro.acao}
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        {registro.entidadeTipo}
                        {registro.entidadeId ? (
                          <span className="block font-mono text-xs text-ink-mute">
                            {registro.entidadeId.slice(0, 8)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate font-mono text-xs text-ink-mute">
                        {JSON.stringify(registro.detalhes)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalPaginas > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
            <p className="text-sm text-ink-soft">
              {total} registro(s) · página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              {pagina > 1 ? (
                <Link
                  href={query({ pagina: String(pagina - 1) })}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              ) : null}
              {pagina < totalPaginas ? (
                <Link
                  href={query({ pagina: String(pagina + 1) })}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-t border-line p-4 text-sm text-ink-soft">
            {total} registro(s)
          </div>
        )}
      </Card>
    </div>
  );
}
