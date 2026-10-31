/**
 * Protocolo curto e estável da solicitação (8 caracteres do UUID).
 *
 * Fica em módulo próprio porque um arquivo "use server" só pode exportar
 * funções assíncronas — e tanto a action quanto a tela usam este formato.
 */
export function protocoloDaSolicitacao(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
