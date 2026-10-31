// src/app/(admin)/admin/negocios/page.tsx
import { listarNegociosAction } from "@/application/negocios/listar";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
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
import { Badge } from "@/ui/components/badge";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  AdminPageHeader,
  SITUACOES,
  SituacaoBadge,
} from "@/app/(admin)/_components/admin-shared";

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    situacao?: string;
    busca?: string;
  }>;
}) {
  const params = await searchParams;
  const pagina = Number(params?.pagina) || 1;
  const situacao = params?.situacao;
  const busca = params?.busca;

  const formData = new FormData();
  if (situacao) formData.append("situacao", situacao);
  if (busca) formData.append("busca", busca);
  formData.append("pagina", String(pagina));
  formData.append("porPagina", "20");

  const result = await listarNegociosAction({
    pagina: Number(pagina),
    porPagina: 20,
    situacao: situacao || undefined,
    busca: busca || undefined,
  });

  const { negocios, paginacao } = result;
  const { total, pagina: currentPagina, porPagina, totalPaginas } = paginacao;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Comércios"
        description="Gerenciar os comércios cadastrados no GuiaBG."
      >
        <Button asChild size="sm" className="h-10">
          <Link href="/admin/negocios/novo">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo comércio
          </Link>
        </Button>
      </AdminPageHeader>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-mute"
                  aria-hidden="true"
                />
                <Input
                  id="busca"
                  name="busca"
                  placeholder="Nome do comércio..."
                  value={params.busca || ""}
                  className="h-10 pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="situacao">Situação</Label>
              <NativeSelect
                id="situacao"
                name="situacao"
                value={params.situacao || ""}
              >
                <option value="">Todas</option>
                {SITUACOES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" size="sm" className="h-10">
              <Search className="h-4 w-4" aria-hidden="true" />
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
                  <TableHead>Comércio</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Categorias</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negocios.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-ink-mute"
                    >
                      Nenhum comércio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  negocios.map((neg: any) => (
                    <TableRow key={neg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-ink">{neg.nome}</p>
                          <p className="text-sm text-ink-mute">
                            {neg.descricao?.substring(0, 100)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SituacaoBadge situacao={neg.situacaoPublicacao} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {neg.categorias?.map(
                            (c: { id: string; nome: string }) => (
                              <Badge key={c.id} variant="outline">
                                {c.nome}
                              </Badge>
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        {new Date(neg.criadoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/negocios/${neg.id}`}
                          className="inline-flex min-h-10 items-center text-sm font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                        >
                          Editar
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalPaginas > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
            <p className="text-sm text-ink-soft">
              Mostrando {(pagina - 1) * 20 + 1} a {Math.min(pagina * 20, total)}{" "}
              de {total} resultados
            </p>
            <div className="flex gap-2">
              {currentPagina > 1 && (
                <Link
                  href={`/admin/negocios?pagina=${currentPagina - 1}${situacao ? `&situacao=${situacao}` : ""}${busca ? `&busca=${busca}` : ""}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              )}
              {currentPagina < totalPaginas && (
                <Link
                  href={`/admin/negocios?pagina=${currentPagina + 1}${situacao ? `&situacao=${situacao}` : ""}${busca ? `&busca=${busca}` : ""}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
