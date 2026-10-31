// src/app/(admin)/admin/solicitacoes/page.tsx
import { listarSolicitacoesAction } from "@/application/solicitacoes/listar";
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
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

const SITUACOES = [
  { value: "recebida", label: "Recebida" },
  { value: "em_fila_contestacao", label: "Em fila contestação" },
  { value: "aprovada", label: "Aprovada" },
  { value: "reprovada", label: "Reprovada" },
  { value: "incompleta", label: "Incompleta" },
] as const;

const TIPOS = [
  { value: "inclusao", label: "Inclusão" },
  { value: "atualizacao", label: "Atualização" },
] as const;

const SITUACAO_CLASSES: Record<string, string> = {
  recebida: "border-brand/20 bg-brand-tint text-brand-strong",
  em_fila_contestacao: "border-warning/30 bg-warning-tint text-warning",
  aprovada: "border-positive/30 bg-positive-tint text-positive",
  reprovada: "border-critical/30 bg-critical-tint text-critical",
  incompleta: "border-line bg-surface-2 text-ink-soft",
};

const SITUACAO_LABELS: Record<string, string> = {
  recebida: "Recebida",
  em_fila_contestacao: "Em fila",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  incompleta: "Incompleta",
};

function SituacaoBadge({ situacao }: { situacao: string }) {
  return (
    <Badge
      variant="outline"
      className={
        SITUACAO_CLASSES[situacao] ?? "border-line bg-surface-2 text-ink-soft"
      }
    >
      {SITUACAO_LABELS[situacao] || situacao}
    </Badge>
  );
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    situacao?: string;
    tipo?: string;
    busca?: string;
  }>;
}) {
  const params = await searchParams;
  const pagina = Number(params.pagina) || 1;
  const situacao = params.situacao;
  const tipo = params.tipo;
  const busca = params.busca;

  const formData = new FormData();
  if (situacao) formData.append("situacao", situacao);
  if (tipo) formData.append("tipo", tipo);
  if (busca) formData.append("busca", busca);
  formData.append("pagina", String(pagina));
  formData.append("porPagina", "20");

  const result = await listarSolicitacoesAction(null, formData);

  if ("error" in result) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Solicitações"
          description="Gerenciar solicitações de inclusão e atualização."
        />
        <div
          role="alert"
          className="rounded-xl border border-critical/30 bg-critical-tint p-4 text-sm text-critical"
        >
          Erro ao carregar solicitações: {result.error}
        </div>
      </div>
    );
  }

  const {
    solicitacoes,
    total,
    pagina: currentPagina,
    porPagina,
    totalPaginas,
  } = result;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Solicitações"
        description="Gerenciar solicitações de inclusão e atualização."
      />

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
                  placeholder="Nome do negócio..."
                  value={busca || ""}
                  className="h-10 pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="situacao">Situação</Label>
              <NativeSelect
                id="situacao"
                name="situacao"
                value={situacao || ""}
              >
                <option value="">Todas</option>
                {SITUACOES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <NativeSelect id="tipo" name="tipo" value={tipo || ""}>
                <option value="">Todos</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
                  <TableHead>Negócio</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-ink-mute"
                    >
                      Nenhuma solicitação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((sol: any) => (
                    <TableRow key={sol.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-ink">
                            {sol.dadosNegocioProposto?.nome || "N/A"}
                          </p>
                          <p className="text-sm text-ink-mute">
                            {sol.tipo === "inclusao"
                              ? "Inclusão"
                              : "Atualização"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-ink">
                            {sol.solicitante?.nome || "N/A"}
                          </p>
                          <p className="text-sm text-ink-mute">
                            {sol.solicitante?.email || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {sol.tipo === "inclusao" ? "Inclusão" : "Atualização"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SituacaoBadge situacao={sol.situacao} />
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        {new Date(sol.criadoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/solicitacoes/${sol.id}`}
                          className="inline-flex min-h-10 items-center text-sm font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                        >
                          Ver detalhes
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
              Mostrando {(currentPagina - 1) * porPagina + 1} a{" "}
              {Math.min(currentPagina * porPagina, total)} de {total} resultados
            </p>
            <div className="flex gap-2">
              {currentPagina > 1 && (
                <Link
                  href={`/admin/solicitacoes?pagina=${currentPagina - 1}${situacao ? `&situacao=${situacao}` : ""}${tipo ? `&tipo=${tipo}` : ""}${busca ? `&busca=${busca}` : ""}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              )}
              {currentPagina < totalPaginas && (
                <Link
                  href={`/admin/solicitacoes?pagina=${currentPagina + 1}${situacao ? `&situacao=${situacao}` : ""}${tipo ? `&tipo=${tipo}` : ""}${busca ? `&busca=${busca}` : ""}`}
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
