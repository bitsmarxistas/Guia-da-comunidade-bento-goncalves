import { Building2 } from "lucide-react";
import {
  ImagemNegocio,
  podeExibirImagem,
} from "@/ui/components/imagem-negocio";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "G";
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] : "";
  return (primeira + (ultima ?? "")).toUpperCase();
}

/**
 * Galeria da ficha (§5.4): capa 3:2 + até 4 fotos aprovadas em miniatura.
 *
 * Sem JavaScript: a capa é a primeira foto e cada miniatura é um link para a
 * imagem em tamanho real. Quando não há foto aprovada, entra o bloco desenhado
 * com o monograma — nunca uma caixa vazia.
 */
export function GaleriaNegocio({
  nome,
  categoria,
  imagens,
}: {
  nome: string;
  categoria: string | null;
  imagens: Array<{ id: string; url: string; tipo: string }>;
}) {
  const visiveis = imagens.filter((imagem) => podeExibirImagem(imagem.url));
  const capa = visiveis[0];
  const miniaturas = visiveis.slice(1, 5);

  return (
    <div>
      <div className="relative aspect-[3/2] overflow-hidden rounded-[22px] border border-line bg-brand-tint">
        {capa ? (
          <ImagemNegocio
            url={capa.url}
            alt={`Foto de ${nome}`}
            sizes="(min-width: 1024px) 62vw, 92vw"
            prioridade
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brand"
          >
            <Building2 className="size-12" />
            <span className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold">
              {iniciais(nome)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-strong">
              {categoria ?? "Comércio local"}
            </span>
          </div>
        )}
      </div>

      {miniaturas.length > 0 ? (
        <ul className="mt-3 grid grid-cols-4 gap-3">
          {miniaturas.map((imagem, indice) => (
            <li key={imagem.id}>
              <a
                href={imagem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-square overflow-hidden rounded-[14px] border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                aria-label={`Abrir foto ${indice + 2} de ${nome}`}
              >
                <ImagemNegocio
                  url={imagem.url}
                  alt={`Foto ${indice + 2} de ${nome}`}
                  sizes="(min-width: 1024px) 15vw, 22vw"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
