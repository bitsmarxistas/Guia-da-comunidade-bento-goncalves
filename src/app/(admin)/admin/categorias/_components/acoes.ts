"use server";

import { criarCategoriaAction } from "@/application/categorias/criar";
import { editarCategoriaAction } from "@/application/categorias/editar";

/**
 * Um único ponto de entrada para o formulário de categoria.
 * A action real fica na camada de aplicação (validação, log e auditoria).
 */
export async function crearOuEditar(formData: FormData) {
  const id = formData.get("id");
  const resultado = id
    ? await editarCategoriaAction(null, formData)
    : await criarCategoriaAction(null, formData);

  if ("error" in resultado && resultado.error) {
    return { success: false, error: String(resultado.error) };
  }

  return { success: true, error: null };
}
