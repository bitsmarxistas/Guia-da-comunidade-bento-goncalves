"use server";

import { criarNegocioAction } from "@/application/negocios/criar";
import { editarNegocioAction } from "@/application/negocios/editar";

/**
 * Entrada única do formulário de comércio do admin.
 *
 * O formulário manda os campos do endereço soltos (como o wizard público);
 * aqui eles viram o JSON que as actions esperam. Sem isso a ficha do painel
 * não conseguia gravar CEP, número nem "sem ponto comercial" — a mesma ficha
 * que o formulário público já preenchia.
 */
export async function salvarNegocio(formData: FormData) {
  const id = formData.get("id");

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const temCoordenadas =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  formData.set(
    "localizacao",
    JSON.stringify({
      endereco: formData.get("endereco") || undefined,
      numero: formData.get("numero") || undefined,
      bairro: formData.get("bairro") || undefined,
      cep: formData.get("cep") || undefined,
      areaAtendimento: formData.get("areaAtendimento") || undefined,
      semPontoComercial: formData.get("semPontoComercial") === "true",
      ...(temCoordenadas ? { latitude, longitude } : {}),
    }),
  );

  const resultado = id
    ? await editarNegocioAction(null, formData)
    : await criarNegocioAction(null, formData);

  if ("error" in resultado && resultado.error) {
    return { success: false, error: String(resultado.error) };
  }

  return { success: true, error: null };
}
