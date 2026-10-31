// src/domain/utils/cep.ts
// Utilitários puros de CEP. Ficam fora do arquivo "use server" porque um
// módulo de server actions só pode exportar funções assíncronas — importar
// `normalizarCep` de lá quebrava o build do cliente.
export function normalizarCep(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(valor: string): string {
  const digitos = normalizarCep(valor);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
}

export function cepValido(valor: string): boolean {
  const digitos = normalizarCep(valor);
  return digitos.length === 8 && !/^0{8}$/.test(digitos);
}
