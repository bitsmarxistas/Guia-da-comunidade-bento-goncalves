/**
 * Diferença entre a ficha publicada e o que o chamado de correção propõe.
 *
 * O pedido de correção nunca altera o comércio direto: ele abre um chamado com
 * a lista do que deve mudar, e é essa lista que a equipe aprova no painel.
 * Guardar a diferença (e não só o formulário inteiro) permite à equipe ver
 * "de → para" e impedir aprovação de chamado vazio.
 */
export interface CamposComparaveis {
  nome: string;
  descricao: string;
  whatsapp: string;
  bairro: string;
  endereco: string;
  categorias: string[];
}

export interface AlteracaoCampo {
  /** Identificador estável do campo (usado na UI e em relatório). */
  campo: keyof CamposComparaveis | "categorias";
  rotulo: string;
  de: string;
  para: string;
}

const ROTULOS: Record<string, string> = {
  nome: "Nome",
  descricao: "Descrição",
  whatsapp: "WhatsApp",
  bairro: "Bairro",
  endereco: "Endereço",
  categorias: "Categorias",
};

function limpar(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

export function calcularAlteracoes(
  atual: CamposComparaveis,
  proposto: CamposComparaveis,
): AlteracaoCampo[] {
  const alteracoes: AlteracaoCampo[] = [];

  const simples: Array<keyof Omit<CamposComparaveis, "categorias">> = [
    "nome",
    "descricao",
    "whatsapp",
    "bairro",
    "endereco",
  ];

  for (const campo of simples) {
    const de = limpar(atual[campo]);
    const para = limpar(proposto[campo]);
    if (de !== para) {
      alteracoes.push({ campo, rotulo: ROTULOS[campo] ?? campo, de, para });
    }
  }

  const deCategorias = [...new Set(atual.categorias.map(limpar))]
    .filter(Boolean)
    .sort();
  const paraCategorias = [...new Set(proposto.categorias.map(limpar))]
    .filter(Boolean)
    .sort();

  if (deCategorias.join("|") !== paraCategorias.join("|")) {
    alteracoes.push({
      campo: "categorias",
      rotulo: "Categorias",
      de: deCategorias.join(", ") || "—",
      para: paraCategorias.join(", ") || "—",
    });
  }

  return alteracoes;
}
