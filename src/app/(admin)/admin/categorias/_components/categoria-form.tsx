"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { crearOuEditar } from "./acoes";

type Estado = { success?: boolean; error?: string | null };

export interface CategoriaFormDados {
  id?: string;
  nome?: string;
  descricao?: string | null;
  oculta?: boolean;
  ativa?: boolean;
}

export function CategoriaForm({
  categoria,
}: {
  categoria?: CategoriaFormDados;
}) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    async (_prev, formData) => crearOuEditar(formData),
    { success: false, error: null },
  );

  useEffect(() => {
    if (estado.success) {
      router.push("/admin/categorias");
      router.refresh();
    }
  }, [estado.success, router]);

  return (
    <form action={acao} className="space-y-4">
      {categoria?.id ? (
        <input type="hidden" name="id" value={categoria.id} />
      ) : null}

      {estado.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-critical/40 bg-critical-tint p-3 text-sm text-ink"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-critical"
            aria-hidden="true"
          />
          <span>{estado.error}</span>
        </div>
      ) : null}

      {estado.success ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-positive/40 bg-positive-tint p-3 text-sm text-ink">
          <CheckCircle className="size-4 text-positive" aria-hidden="true" />
          Salvo com sucesso.
        </div>
      ) : null}

      <div>
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={categoria?.nome ?? ""}
          required
          maxLength={100}
          className="mt-2 h-11"
          placeholder="Ex.: Padarias e confeitarias"
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={categoria?.descricao ?? ""}
          maxLength={500}
          rows={3}
          className="mt-2"
          placeholder="Como essa categoria aparece para o visitante."
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line bg-surface-2 p-3 text-sm">
        <input
          type="checkbox"
          name="oculta"
          defaultChecked={categoria?.oculta ?? false}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span>
          <strong className="block text-ink">Categoria oculta</strong>
          <span className="text-ink-soft">
            Continua disponível no catálogo e nos filtros, mas não aparece na
            home nem nos atalhos de categoria.
          </span>
        </span>
      </label>

      {categoria?.id ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line bg-surface-2 p-3 text-sm">
          <input
            type="checkbox"
            name="ativa"
            defaultChecked={categoria?.ativa ?? true}
            className="mt-0.5 size-4 accent-[var(--brand)]"
          />
          <span>
            <strong className="block text-ink">Categoria ativa</strong>
            <span className="text-ink-soft">
              Desmarcar equivale a desativar: some do catálogo público e dos
              formulários.
            </span>
          </span>
        </label>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendente}>
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : categoria?.id ? (
            "Salvar alterações"
          ) : (
            "Criar categoria"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categorias")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
