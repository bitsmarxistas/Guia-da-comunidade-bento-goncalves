/**
 * Compõe o endereço exibido sem repetir pedaços.
 *
 * O campo `endereco` é texto livre (o solicitante costuma digitar "Rua X, 123
 * - Centro"), então somar `numero` e `bairro` sempre gerava "Rua X, 123 -
 * Centro, 100 — Centro". Aqui cada pedaço só entra se ainda não estiver lá.
 */
export function comporEndereco({
  endereco,
  numero,
  bairro,
  cidade = "Bento Gonçalves",
  uf = "RS",
}: {
  endereco: string;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}): string {
  const normalizar = (valor: string) =>
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  let resultado = endereco.trim();
  const base = normalizar(resultado);

  const numeroLimpo = (numero ?? "").trim();
  if (numeroLimpo && !new RegExp(`\\b${numeroLimpo}\\b`).test(resultado)) {
    resultado = `${resultado}, ${numeroLimpo}`;
  }

  const bairroLimpo = (bairro ?? "").trim();
  if (bairroLimpo && !base.includes(normalizar(bairroLimpo))) {
    resultado = `${resultado} — ${bairroLimpo}`;
  }

  const cidadeLimpa = (cidade ?? "").trim();
  if (cidadeLimpa && !normalizar(resultado).includes(normalizar(cidadeLimpa))) {
    resultado = `${resultado}, ${cidadeLimpa}${uf ? `/${uf}` : ""}`;
  }

  return resultado;
}
