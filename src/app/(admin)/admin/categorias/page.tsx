// src/app/(admin)/admin/categorias/page.tsx
import { listarCategoriasAction } from "@/application/categorias/listar";
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
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    ativa?: string;
    busca?: string;
  }>;
}) {
  const params = (await searchParams) as {
    pagina?: string;
    ativa?: string;
    busca?: string;
  };
  const pagina = Number(params?.pagina) || 1;
  const ativa = params?.ativa;
  const busca = params?.busca;

  const result = await listarCategoriasAction({
    pagina: Number(pagina),
    porPagina: 20,
    ativa: ativa === "true" ? true : ativa === "false" ? false : undefined,
    busca: busca || undefined,
  });

  const { categorias, paginacao } = result;
  const { total, pagina: currentPagina, porPagina, totalPaginas } = paginacao;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categorias"
        description="Organizar as categorias do catálogo do GuiaBG."
      >
        <Button asChild size="sm" className="h-10">
          <Link href="/admin/categorias/novo">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova categoria
          </Link>
        </Button>
      </AdminPageHeader>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
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
                  placeholder="Nome da categoria..."
                  defaultValue={params.busca || ""}
                  className="h-10 pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ativa">Status</Label>
              <NativeSelect
                id="ativa"
                name="ativa"
                defaultValue={params.ativa || ""}
              >
                <option value="">Todas</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-ink-mute"
                    >
                      Nenhuma categoria encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map(
                    (cat: {
                      id: string;
                      nome: string;
                      slug: string;
                      ativa: boolean;
                      criadoEm: string | Date;
                    }) => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <p className="font-medium text-ink">{cat.nome}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-ink-mute">
                            {cat.slug}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              cat.ativa
                                ? "border-positive/30 bg-positive-tint text-positive"
                                : "border-line bg-surface-2 text-ink-soft"
                            }
                          >
                            {cat.ativa ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-ink-soft">
                          {new Date(cat.criadoEm).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/categorias/${cat.id}`}
                            className="inline-flex min-h-10 items-center text-sm font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                          >
                            Editar
                          </Link>
                        </TableCell>
                      </TableRow>
                    ),
                  )
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
                  href={`/admin/categorias?pagina=${currentPagina - 1}${params.ativa ? `&ativa=${params.ativa}` : ""}${params.busca ? `&busca=${params.busca}` : ""}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              )}
              {currentPagina < totalPaginas && (
                <Link
                  href={`/admin/categorias?pagina=${currentPagina + 1}${params.ativa ? `&ativa=${params.ativa}` : ""}${params.busca ? `&busca=${params.busca}` : ""}`}
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
