"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { salvarNegocio } from "./acoes";

type Estado = { success?: boolean; error?: string | null };

const DIAS = [
  { valor: 1, rotulo: "Seg" },
  { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" },
  { valor: 4, rotulo: "Qui" },
  { valor: 5, rotulo: "Sex" },
  { valor: 6, rotulo: "Sáb" },
  { valor: 0, rotulo: "Dom" },
];

export interface NegocioFormDados {
  id?: string;
  nome?: string;
  descricao?: string;
  contatos?: Array<{ tipo: string; valor: string; ordem: number }>;
  localizacao?: {
    endereco?: string | null;
    bairro?: string | null;
    areaAtendimento?: string | null;
  } | null;
  horarios?: Array<{
    diaSemana: number;
    horaAbertura: string;
    horaFechamento: string;
    observacao?: string | null;
  }>;
  categoriasIds?: string[];
}

export function NegocioForm({
  negocio,
  categorias,
}: {
  negocio?: NegocioFormDados;
  categorias: Array<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    async (_prev, formData) => salvarNegocio(formData),
    { success: false, error: null },
  );

  const [dias, setDias] = useState<number[]>(
    negocio?.horarios?.map((h) => h.diaSemana) ?? [1, 2, 3, 4, 5],
  );
  const [abre, setAbre] = useState(
    negocio?.horarios?.[0]?.horaAbertura?.slice(0, 5) ?? "08:00",
  );
  const [fecha, setFecha] = useState(
    negocio?.horarios?.[0]?.horaFechamento?.slice(0, 5) ?? "18:00",
  );
  const [sobAgendamento, setSobAgendamento] = useState(
    negocio?.horarios?.some((h) =>
      (h.observacao ?? "").includes("agendamento"),
    ) ?? false,
  );
  const [whatsapp, setWhatsapp] = useState(
    negocio?.contatos?.find((c) => c.tipo === "whatsapp")?.valor ?? "",
  );
  const [instagram, setInstagram] = useState(
    negocio?.contatos?.find((c) => c.tipo === "instagram")?.valor ?? "",
  );
  const [telefone, setTelefone] = useState(
    negocio?.contatos?.find((c) => c.tipo === "telefone")?.valor ?? "",
  );
  const [selecionadas, setSelecionadas] = useState<string[]>(
    negocio?.categoriasIds ?? [],
  );

  useEffect(() => {
    if (estado.success) {
      router.push("/admin/negocios");
      router.refresh();
    }
  }, [estado.success, router]);

  const contatos = [
    whatsapp.trim()
      ? { tipo: "whatsapp", valor: whatsapp.trim(), ordem: 0 }
      : null,
    telefone.trim()
      ? { tipo: "telefone", valor: telefone.trim(), ordem: 1 }
      : null,
    instagram.trim()
      ? {
          tipo: "instagram",
          valor: instagram.trim().replace(/^@/, ""),
          ordem: 2,
        }
      : null,
  ].filter(Boolean);

  const horarios = dias.length
    ? dias.map((dia) => ({
        diaSemana: dia,
        horaAbertura: sobAgendamento ? "00:00" : abre,
        horaFechamento: sobAgendamento ? "00:00" : fecha,
        observacao: sobAgendamento ? "somente sob agendamento" : undefined,
      }))
    : [];

  return (
    <form action={acao} className="space-y-5">
      {negocio?.id ? (
        <input type="hidden" name="id" value={negocio.id} />
      ) : null}
      <input type="hidden" name="contatos" value={JSON.stringify(contatos)} />
      <input type="hidden" name="horarios" value={JSON.stringify(horarios)} />
      {selecionadas.map((id) => (
        <input key={id} type="hidden" name="categoriasIds" value={id} />
      ))}

      {estado.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-critical/40 bg-critical-tint p-3 text-sm"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-critical"
            aria-hidden="true"
          />
          <span>{estado.error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={negocio?.nome ?? ""}
            required
            className="mt-2 h-11"
            placeholder="Ex.: Padaria do Zé"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Textarea
            id="descricao"
            name="descricao"
            defaultValue={negocio?.descricao ?? ""}
            required
            rows={4}
            className="mt-2"
            placeholder="O que o comércio vende, faz ou atende."
          />
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="mt-2 h-11"
            placeholder="(54) 99999-0000"
            inputMode="tel"
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="mt-2 h-11"
            placeholder="(54) 3456-7890"
            inputMode="tel"
          />
        </div>

        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="mt-2 h-11"
            placeholder="@seucomercio"
          />
        </div>
        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            name="bairro"
            defaultValue={negocio?.localizacao?.bairro ?? ""}
            className="mt-2 h-11"
            placeholder="Centro"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            name="endereco"
            defaultValue={negocio?.localizacao?.endereco ?? ""}
            className="mt-2 h-11"
            placeholder="Rua, número — complemento"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-ink">
          Categorias *
        </legend>
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-[12px] border border-line bg-surface-2 p-3">
          {categorias.map((categoria) => {
            const marcada = selecionadas.includes(categoria.id);
            return (
              <label key={categoria.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={marcada}
                  onChange={(e) =>
                    setSelecionadas((atual) =>
                      e.target.checked
                        ? [...atual, categoria.id]
                        : atual.filter((id) => id !== categoria.id),
                    )
                  }
                />
                <span className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-ink">
          Horário
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIAS.map((dia) => {
            const marcado = dias.includes(dia.valor);
            return (
              <label key={dia.valor} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={marcado}
                  onChange={(e) =>
                    setDias((atual) =>
                      e.target.checked
                        ? [...atual, dia.valor]
                        : atual.filter((d) => d !== dia.valor),
                    )
                  }
                />
                <span className="inline-flex h-9 min-w-11 items-center justify-center rounded-[8px] border border-line bg-surface px-2 text-sm font-semibold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                  {dia.rotulo}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="abre">Abre</Label>
            <Input
              id="abre"
              type="time"
              value={abre}
              onChange={(e) => setAbre(e.target.value)}
              disabled={sobAgendamento}
              className="mt-1 h-10 tabular"
            />
          </div>
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="time"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={sobAgendamento}
              className="mt-1 h-10 tabular"
            />
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sobAgendamento}
              onChange={(e) => setSobAgendamento(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Somente sob agendamento
          </label>
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={pendente || contatos.length === 0}>
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : negocio?.id ? (
            "Salvar alterações"
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Criar comércio
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/negocios")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
