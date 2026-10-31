import Link from "next/link";
import { MapPin } from "lucide-react";
import { GlifoWhatsApp } from "@/ui/components/brand/glifos";
import { ImagemNegocio, primeiraImagem } from "@/ui/components/imagem-negocio";

export interface NegocioCardProps {
  negocio: {
    id: string;
    slug: string;
    nome: string;
    descricao: string;
    categorias: Array<{ id: string; nome: string; slug: string }>;
    contatos: Array<{ tipo: string; valor: string; ordem: number }>;
    localizacao: {
      bairro: string | null;
      areaAtendimento: string | null;
    } | null;
    abertoAgora: "aberto" | "fechado" | "sem_horario";
    imagens?: Array<{ id: string; url: string; tipo: string }>;
  };
  /** Primeiro card merece prioridade de carregamento. */
  prioridade?: boolean;
}

const NOMES_STATUS: Record<string, string> = {
  aberto: "Aberto agora",
  fechado: "Fechado agora",
  sem_horario: "Horário não informado",
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "G";
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] : "";
  return (primeira + (ultima ?? "")).toUpperCase();
}

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) {
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digitos.length === 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return valor;
}

/**
 * Card de comércio (§4): imagem 2:1 (ou fallback desenhado), categoria, nome,
 * bairro e status aberto/fechado com ponto + texto — nunca só cor.
 * O card inteiro é o link; o contato é ação separada.
 */
export function NegocioCard({ negocio, prioridade = false }: NegocioCardProps) {
  const categoria = negocio.categorias[0];
  const bairro =
    negocio.localizacao?.bairro ?? negocio.localizacao?.areaAtendimento ?? null;
  const whatsapp = negocio.contatos.find(
    (contato) => contato.tipo === "whatsapp",
  );
  const status = negocio.abertoAgora ?? "sem_horario";
  // Foto aprovada quando existir; logo é o segundo melhor; monograma por último.
  const imagem =
    primeiraImagem(negocio.imagens, "foto") ??
    primeiraImagem(negocio.imagens, "logo");

  return (
    /*
     * "relative" é obrigatório: o link do título usa `after:absolute
     * after:inset-0` para tornar o card inteiro clicável. Sem um ancestral
     * posicionado, esse ::after se posiciona contra o <body> e cobre a página
     * toda — era o que interceptava os cliques nos filtros do catálogo.
     */
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface transition-colors hover:border-line-strong focus-within:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]">
      <div className="relative aspect-[2/1] overflow-hidden bg-brand-tint">
        {imagem ? (
          <ImagemNegocio
            url={imagem}
            alt={`Foto de ${negocio.nome}`}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
            prioridade={prioridade}
          />
        ) : (
          /* Fallback desenhado: monograma + categoria, nunca caixa vazia */
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-brand/70">
              {iniciais(negocio.nome)}
            </span>
          </div>
        )}
        {categoria ? (
          <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            {categoria.nome}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink">
          <Link
            href={`/negocio/${negocio.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {negocio.nome}
          </Link>
        </h3>

        {bairro ? (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-mute">
            <MapPin className="size-3.5" aria-hidden="true" />
            {bairro}
          </p>
        ) : null}

        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {negocio.descricao}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft">
            <span
              aria-hidden="true"
              className={
                status === "aberto"
                  ? "size-2 rounded-full bg-positive"
                  : status === "fechado"
                    ? "size-2 rounded-full bg-ink-mute"
                    : "size-2 rounded-full border border-ink-mute"
              }
            />
            {NOMES_STATUS[status]}
          </span>

          {whatsapp ? (
            <a
              href={`https://wa.me/55${whatsapp.valor.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-line px-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              aria-label={`WhatsApp de ${negocio.nome}: ${formatarTelefone(whatsapp.valor)}`}
            >
              <GlifoWhatsApp className="size-4 text-positive" />
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
