"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import {
  ImageUpload,
  type MidiaEnviadaArquivo,
} from "@/ui/components/image-upload";
import { criarSolicitacaoAtualizacaoAction } from "@/application/solicitacoes/atualizar";

type Estado = {
  success?: boolean;
  error?: string | null;
  protocolo?: string | null;
  slug?: string | null;
  alteracoes?: Array<{
    campo: string;
    rotulo: string;
    de: string;
    para: string;
  }>;
};

export interface CorrecaoDados {
  negocioId: string;
  slug: string;
  nome: string;
  descricao: string;
  whatsapp: string;
  bairro: string;
  endereco: string;
  categorias: Array<{ id: string; nome: string }>;
  categoriasIds: string[];
  /** Fotos já publicadas na ficha — referência para trocar. */
  fotos: string[];
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
      return {
        success: true,
        error: null,
        protocolo: "protocolo" in resultado ? resultado.protocolo : null,
        slug: "slug" in resultado ? resultado.slug : null,
        alteracoes: "alteracoes" in resultado ? resultado.alteracoes : [],
      };
    },
    { success: false, error: null },
  );

  const [selecionadas, setSelecionadas] = useState<string[]>(
    dados.categoriasIds,
  );
  const [fotosNovas, setFotosNovas] = useState<MidiaEnviadaArquivo[]>([]);
  const [enviandoFotos, setEnviandoFotos] = useState(false);

  /*
   * As fotos sobem antes do envio do formulário e voltam como chave + URL.
   * O `formData.set` é o que leva essa lista para a action — sem isso o
   * upload aconteceria e o chamado chegaria sem imagem nenhuma.
   */
  async function enviarComFotos(formData: FormData) {
    formData.set("imagens", JSON.stringify(fotosNovas));
    await acao(formData);
  }

  if (estado.success) {
    return (
      <div className="mx-auto max-w-xl rounded-[22px] border border-line bg-surface p-6">
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-on-brand">
            <CheckCircle className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
            Chamado de correção aberto
          </h2>
          {estado.protocolo ? (
            <p className="mt-2 text-sm text-ink-soft">
              Protocolo{" "}
              <strong className="font-mono text-ink">{estado.protocolo}</strong>{" "}
              — guarde este número.
            </p>
          ) : null}
          <p className="mt-2 text-ink-soft">
            A ficha de {dados.nome} <strong>não mudou</strong>. A equipe recebeu
            as informações abaixo, confere e publica a correção. A resposta
            chega no e-mail informado em até 24 h.
          </p>
        </div>

        {estado.alteracoes && estado.alteracoes.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-[14px] border border-line">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Campos enviados para aprovação
              </caption>
              <thead className="bg-surface-2 text-xs uppercase tracking-[0.08em] text-ink-soft">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Campo
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Como está hoje
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Como deve ficar
                  </th>
                </tr>
              </thead>
              <tbody>
                {estado.alteracoes.map((alteracao) => (
                  <tr
                    key={alteracao.campo}
                    className="border-t border-line align-top"
                  >
                    <th scope="row" className="px-3 py-2 font-medium text-ink">
                      {alteracao.rotulo}
                    </th>
                    <td className="px-3 py-2 text-ink-mute line-through">
                      {alteracao.de || "—"}
                    </td>
                    <td className="px-3 py-2 text-ink">
                      {alteracao.para || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={`/negocio/${estado.slug ?? dados.slug}`}>
              Voltar para a ficha
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/catalogo">Ver o catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={enviarComFotos} className="space-y-5">
      {/* Aviso explícito: isto abre chamado, não edita a ficha. */}
      <div className="rounded-[14px] border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-ink">
        <p className="font-semibold">Isto abre um chamado para a equipe</p>
        <p className="mt-1 text-ink-soft">
          Nada é alterado na ficha agora. O que você preencher aqui vai para a
          fila de aprovação do painel e só aparece no guia depois de aprovado.
          Preencha apenas o que está errado — o resto fica como está.
        </p>
      </div>
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
      {/*
        Contatos NÃO são enviados: o formulário só mostra o WhatsApp atual como
        referência. Enviar a lista aqui fazia a aprovação apagar telefone,
        e-mail e Instagram da ficha.
      */}
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

      <fieldset className="space-y-4 rounded-[22px] border border-line bg-surface p-5">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Fotos
        </legend>
        <p className="text-sm text-ink-soft">
          Envie a foto certa para substituir a que está publicada. A troca passa
          pela equipe antes de aparecer no guia.
        </p>

        {dados.fotos.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
              Publicadas hoje
            </p>
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {dados.fotos.map((foto) => (
                <li
                  key={foto}
                  className="overflow-hidden rounded-[10px] border border-line"
                >
                  <img
                    src={foto}
                    alt="Foto publicada na ficha"
                    className="aspect-square w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-mute">
            Esta ficha ainda não tem foto publicada — esta é a chance de incluir
            a primeira.
          </p>
        )}

        <ImageUpload
          label="Fotos novas"
          description="JPG, PNG ou WebP até 5 MB · até 4 fotos. A imagem é reduzida antes de subir."
          maxFiles={4}
          onUploadComplete={setFotosNovas}
          onStatusChange={setEnviandoFotos}
        />
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
                <span className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pendente || enviandoFotos}>
        {enviandoFotos ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando as fotos…
          </>
        ) : pendente ? (
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
