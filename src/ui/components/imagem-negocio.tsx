import Image from "next/image";

/**
 * Hospedeiros de imagem que o guia realmente serve.
 *
 * A moderação aprova a imagem pelo `url` gravado na tabela `imagem`. Se esse
 * endereço apontar para um host que não é nosso (dado antigo, seed, link
 * quebrado), a imagem simplesmente não é exibida e o fallback desenhado entra
 * no lugar — melhor que um quadrado quebrado ou um 500 do otimizador.
 */
const HOSTS_PERMITIDOS = ["assets.seudominio.com.br", "guiabg.com.br"];

export function podeExibirImagem(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const alvo = new URL(url);
    if (alvo.protocol !== "https:") return false;
    return (
      HOSTS_PERMITIDOS.includes(alvo.hostname) ||
      alvo.hostname.endsWith(".r2.cloudflarestorage.com")
    );
  } catch {
    return false;
  }
}

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
