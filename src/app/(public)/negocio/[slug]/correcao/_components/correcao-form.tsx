"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { criarSolicitacaoAtualizacaoAction } from "@/application/solicitacoes/atualizar";

type Estado = {
  success?: boolean;
  error?: string | null;
  protocolo?: string | null;
};

export interface CorrecaoDados {
  negocioId: string;
  nome: string;
  descricao: string;
  whatsapp: string;
  bairro: string;
  endereco: string;
  categorias: Array<{ id: string; nome: string }>;
  categoriasIds: string[];
}

/**
 * Correção de ficha (somente modificação).
 * Diferente do wizard de inclusão: aqui o pedido aponta para um comércio que já
 * existe e passa pelo mesmo processo de aprovação; ao ser aprovado, ATUALIZA a
 * ficha em vez de criar outra.
 */
export function CorrecaoForm({ dados }: { dados: CorrecaoDados }) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    async (_prev, formData) => {
      const resultado = await criarSolicitacaoAtualizacaoAction(null, formData);
      if ("error" in resultado && resultado.error) {
        return { success: false, error: String(resultado.error) };
      }
      return { success: true, error: null };
    },
    { success: false, error: null },
  );

  const [selecionadas, setSelecionadas] = useState<string[]>(
    dados.categoriasIds,
  );

  if (estado.success) {
    return (
      <div className="mx-auto max-w-md rounded-[22px] border border-line bg-surface p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-on-brand">
          <CheckCircle className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
          Correção enviada
        </h2>
        <p className="mt-2 text-ink-soft">
          Recebemos a correção de {dados.nome}. Ela passa pela análise e a
          resposta chega no e-mail informado em até 24 h.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href={`/negocio/`}>Voltar ao guia</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="negocioId" value={dados.negocioId} />
      <input
        type="hidden"
        name="declaracaoVinculo"
        value="Correção de informações da ficha"
      />
      <input type="hidden" name="aceiteTermos" value="true" />
      {selecionadas.map((id) => (
        <input key={id} type="hidden" name="categoriasIds" value={id} />
      ))}
      <input
        type="hidden"
        name="contatos"
        value={JSON.stringify([
          { tipo: "whatsapp", valor: dados.whatsapp, ordem: 0 },
        ])}
      />
      <input
        type="hidden"
        name="localizacao"
        value={JSON.stringify({
          bairro: dados.bairro,
          endereco: dados.endereco,
        })}
      />

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

      <fieldset className="space-y-4 rounded-[22px] border border-line bg-surface p-5">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Quem está pedindo
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nomeSolicitante">Seu nome *</Label>
            <Input
              id="nomeSolicitante"
              name="nomeSolicitante"
              required
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 h-11"
              placeholder="voce@exemplo.com"
            />
            <p className="mt-1 text-xs text-ink-mute">
              A resposta da análise chega neste e-mail.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              name="telefone"
              required
              className="mt-2 h-11"
              placeholder="(54) 99999-0000"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-[22px] border border-line bg-surface p-5">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Dados corretos da ficha
        </legend>
        <div>
          <Label htmlFor="nomeNegocio">Nome do comércio *</Label>
          <Input
            id="nomeNegocio"
            name="nomeNegocio"
            defaultValue={dados.nome}
            required
            className="mt-2 h-11"
          />
        </div>
        <div>
          <Label htmlFor="descricao">Descrição *</Label>
          <Textarea
            id="descricao"
            name="descricao"
            defaultValue={dados.descricao}
            required
            rows={4}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            value={dados.whatsapp}
            readOnly
            className="mt-2 h-11 bg-surface-2"
          />
          <p className="mt-1 text-xs text-ink-mute">
            Para trocar o WhatsApp, use a área de contato do guia.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              name="bairro"
              defaultValue={dados.bairro}
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              defaultValue={dados.endereco}
              className="mt-2 h-11"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-[22px] border border-line bg-surface p-5">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Categorias
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {dados.categorias.map((categoria) => {
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
                <span className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pendente}>
        {pendente ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          "Enviar correção"
        )}
      </Button>
      <p className="text-xs text-ink-mute">
        A correção passa pela análise da equipe antes de aparecer no guia. Não é
        possível alterar informações sem aprovação.
      </p>
    </form>
  );
}
