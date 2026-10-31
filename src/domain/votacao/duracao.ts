// src/domain/votacao/duracao.ts

/**
 * Regra de produto: toda votação dura exatamente 24 horas, contadas a partir
 * da abertura. O prazo não é parâmetro de negócio — não existe escolha de
 * data na abertura nem na interface.
 *
 * O encerramento automático SEMPRE lê `votacao.encerra_em` do banco. Assim,
 * votações antigas abertas com outro prazo continuam sendo encerradas no
 * instante que já estava gravado; esta constante só governa novas aberturas.
 */
export const DURACAO_VOTACAO_HORAS = 24;

const MILISSEGUNDOS_POR_HORA = 60 * 60 * 1000;

export const DURACAO_VOTACAO_MS =
  DURACAO_VOTACAO_HORAS * MILISSEGUNDOS_POR_HORA;

/**
 * Calcula o instante de encerramento de uma votação aberta em `iniciadaEm`.
 *
 * A soma é feita em milissegundos (duração absoluta de 24 h), e não em dias de
 * calendário, para não variar com horário de verão/fuso do servidor.
 */
export function calcularEncerramento(iniciadaEm: Date): Date {
  return new Date(iniciadaEm.getTime() + DURACAO_VOTACAO_MS);
}

/**
 * Horas restantes até `encerraEm`, arredondadas para cima (uma votação com
 * 30 minutos restantes aparece como "1 h"). Nunca devolve valor negativo.
 */
export function calcularHorasRestantes(
  encerraEm: Date,
  agora: Date = new Date(),
): number {
  const restanteMs = encerraEm.getTime() - agora.getTime();
  if (restanteMs <= 0) return 0;
  return Math.ceil(restanteMs / MILISSEGUNDOS_POR_HORA);
}
