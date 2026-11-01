import Image from "next/image";
import { podeExibirImagem } from "@/domain/midia/url-publica";

/**
 * A regra de host vive em `domain/midia/url-publica` (testável). Aqui fica só
 * a renderização: foto aprovada quando o host é nosso, monograma desenhado
 * quando não é.
 */
export { podeExibirImagem };

export function primeiraImagem(
  imagens: Array<{ url: string; tipo: string }> | undefined,
  preferirTipo?: "logo" | "foto",
): string | null {
  if (!imagens || imagens.length === 0) return null;
  const ordenadas = preferirTipo
    ? [...imagens].sort((a, b) =>
        a.tipo === preferirTipo ? -1 : b.tipo === preferirTipo ? 1 : 0,
      )
    : imagens;
  const escolhida = ordenadas.find((img) => podeExibirImagem(img.url));
  return escolhida?.url ?? null;
}

export function ImagemNegocio({
  url,
  alt,
  sizes,
  prioridade = false,
  className = "object-cover",
}: {
  url: string;
  alt: string;
  sizes: string;
  prioridade?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={prioridade}
      className={className}
    />
  );
}
