/**
 * Que endereço de imagem o guia aceita exibir.
 *
 * Fica no domínio (e não dentro do componente) para poder ser testado sem
 * Next: é a regra que decide se a foto aprovada aparece na ficha ou se o bloco
 * desenhado com o monograma entra no lugar.
 */

const HOSTS_LEGADOS = ["assets.seudominio.com.br", "guiabg.com.br"];

export function hostDoBucket(
  basePublica: string | undefined = process.env.R2_PUBLIC_URL,
): string | null {
  if (!basePublica) return null;
  try {
    return new URL(basePublica).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function podeExibirImagem(
  url: string | null | undefined,
  basePublica?: string,
): boolean {
  if (!url) return false;
  try {
    const alvo = new URL(url);
    if (alvo.protocol !== "https:") return false;
    const host = alvo.hostname.toLowerCase();

    if (HOSTS_LEGADOS.includes(host)) return true;
    if (host === hostDoBucket(basePublica)) return true;
    /*
     * `*.r2.dev` é o domínio público de um bucket R2. O bucket de produção
     * responde em `pub-….r2.dev` — antes a checagem só conhecia
     * `*.r2.cloudflarestorage.com` (endpoint privado da API), então toda foto
     * aprovada era escondida do site. Só chega URL daqui se o servidor validou
     * a chave no envio.
     */
    return host.endsWith(".r2.dev");
  } catch {
    return false;
  }
}
