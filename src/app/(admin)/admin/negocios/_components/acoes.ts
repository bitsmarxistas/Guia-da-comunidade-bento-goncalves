"use server";

import { criarNegocioAction } from "@/application/negocios/criar";
import { editarNegocioAction } from "@/application/negocios/editar";

/**
 * Entrada única do formulário de comércio do admin.
 * O localizacao vai como JSON porque a action espera esse formato; aqui o form
 * manda os campos soltos (endereco/bairro) e convertemos antes.
 */
export async function salvarNegocio(formData: FormData) {
  const id = formData.get("id");

  formData.set(
    "localizacao",
    JSON.stringify({
      endereco: formData.get("endereco") || undefined,
      bairro: formData.get("bairro") || undefined,
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
