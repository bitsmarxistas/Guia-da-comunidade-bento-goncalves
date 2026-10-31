// src/scripts/importacao/lista-whatsapp.ts
//
// Fonte: mensagens de WhatsApp de 26 e 27/10/2026 (lista prévia de locais a
// serem analisados em Bento Gonçalves e região, enviada por colaborador do
// guia). Só entra aqui o que estava escrito na mensagem: nome, handle de
// Instagram quando citado, endereço quando citado e a pessoa de contato
// ("Alexandre Chiminazzo", "Almir Saldanha").
//
// O resto (telefone, endereço completo, horário) fica vazio de propósito:
// esses pedidos entram na fila de aprovação para a equipe conferir, não como
// ficha publicada com dado inventado.

export interface ItemImportado {
  nome: string;
  categoria: string;
  instagram?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  responsavel?: string;
  observacao?: string;
}

const i = (
  nome: string,
  categoria: string,
  extras: Partial<ItemImportado> = {},
): ItemImportado => ({ nome, categoria, ...extras });

const BG = "Bento Gonçalves";

export const LISTA_WHATSAPP: ItemImportado[] = [
  // ── citados nas mensagens, com Instagram ──────────────────────────────
  i("Pague Poko", "lojas-em-geral", {
    observacao: "Loja citada em conversa; confirmar ramo e endereço.",
  }),
  i("Nina Bogoni — Finanças", "consultoria", {
    instagram: "ninabogoni.financas",
    observacao: "Consultoria em finanças pessoais.",
  }),
  i("Soto Rooftop", "restaurantes", {
    observacao: "Rooftop; confirmar endereço.",
  }),
  i("O Polvo Sushi", "sushi-e-comida-japonesa", {
    instagram: "opolvo2026",
    observacao: "Também atende em Garibaldi (aiqufome).",
  }),
  i("Nômade in Nature", "lojas-em-geral", {
    observacao: "Loja citada em conversa; confirmar ramo.",
  }),
  i("Loja Atrativa", "moda-roupas-e-calcados", {
    instagram: "loja_atrativabg",
  }),
  i("Sierra Burguer", "hamburguerias-e-lanchonetes"),
  i("Neblina Artesanato", "presentes-e-artesanato", {
    instagram: "neblinaartesanato",
  }),
  i("Michael Henrique — Motorista", "transporte-de-cargas-e-passageiros", {
    observacao: "Motorista particular.",
  }),
  i("Vintage Brechó", "moda-roupas-e-calcados", {
    instagram: "vintage_brechov",
    observacao: "Brechó.",
  }),
  i("Nico — Crochê", "presentes-e-artesanato", {
    instagram: "itsnico_ch",
    observacao: "Crochê artesanal; sem perfil exclusivo de loja.",
  }),

  // ── lista prévia (itens 1 a 61) ───────────────────────────────────────
  i("Ale Center Veículos", "veiculos", { responsavel: "Alexandre Chiminazzo" }),
  i("Adega Caitá", "bebidas", { observacao: "Também em Garibaldi." }),
  i("Brik de Usados", "moda-roupas-e-calcados", {
    endereco: "Avenida Independência",
    observacao: "Loja de usados.",
  }),
  i("Metalalumínio", "casa-e-construcao", { responsavel: "Antonio" }),
  i("Ferragens Conzati", "casa-e-construcao"),
  i("Variedades & Casa — Produtos de Limpeza", "lojas-em-geral", {
    endereco: "Rua Frei Miguel",
    bairro: "São Francisco",
  }),
  i("Zucchero — Docinhos e Salgadinhos", "padarias-e-confeitarias"),
  i("Bradesco", "instituicoes-financeiras", {
    observacao: "Rede bancária; confirmar agência.",
  }),
  i("Itaú", "instituicoes-financeiras", {
    observacao: "Rede bancária; confirmar agência.",
  }),
  i("Magalu", "lojas-de-departamento", { observacao: "Rede nacional." }),
  i("Lojas Renner", "moda-roupas-e-calcados", { observacao: "Rede nacional." }),
  i("Natura", "beleza-e-estetica", {
    observacao: "Consultoria de cosméticos; confirmar revendedora.",
  }),
  i("PK Engenharia e Construções", "construcao"),
  i("Almir Saldanha — Pedreiro", "construcao", {
    responsavel: "Almir Saldanha",
  }),
  i("Padaria Bonadiman", "padarias-e-confeitarias"),
  i("Mercado Mundial", "supermercados-e-mercados"),
  i("Koskark Lanches", "hamburguerias-e-lanchonetes"),
  i("Frasca Pizzeria", "pizzarias", { cidade: "Carlos Barbosa" }),
  i("Brick Sul", "moda-roupas-e-calcados", {
    observacao: "Loja de usados/brechó.",
  }),
  i("Tabacaria Benvenuto", "lojas-em-geral"),
  i("Sandro Garda — Advocacia", "advogados", { responsavel: "Sandro Garda" }),
  i("Alberton & Frighetto Advogados Associados", "advogados"),
  i("Embutidos Nono Honório", "acougues", {
    observacao: "Embutidos artesanais.",
  }),
  i("Mundo do Presente", "presentes-e-artesanato"),
  i("Clube Vasco", "esporte-e-lazer", {
    observacao: "Nome truncado na mensagem original; confirmar.",
  }),
  i("Sucatas FS", "comercio-de-pecas"),
  i("Faculdade Fisul", "educacao"),
  i("Flor de Biju", "presentes-e-artesanato", { observacao: "Bijuterias." }),
  i("Pasqualoto Seguros", "servicos"),
  i("Bella Ragazza Cosméticos", "beleza-e-estetica"),
  i("Janete Berté — Doces e Salgados", "padarias-e-confeitarias", {
    responsavel: "Janete Berté",
  }),
  i("Cerealista Costi", "supermercados-e-mercados", {
    observacao: "Cerealista.",
  }),
  i("Osteria Colombina", "restaurantes"),
  i("Beatriz Tressoldi — Podologia", "clinicas-medicas", {
    responsavel: "Beatriz Tressoldi",
  }),
  i("Luana Meneghetti — Vereadora", "associacoes-e-entidades", {
    responsavel: "Luana Meneghetti",
    observacao: "Mandato político; avaliar se entra no guia.",
  }),
  i("PC — Taxista", "transporte-de-cargas-e-passageiros", {
    observacao: "Taxista.",
  }),
  i("Casa de Repouso Arco-Íris", "saude"),
  i("Cinara Pagliarini — Floricultura", "presentes-e-artesanato", {
    responsavel: "Cinara Pagliarini",
  }),
  i("Mazze Agência", "consultoria", { observacao: "Agência de marketing." }),
  i("Brinquelandia", "brinquedos-e-jogos"),
  i("Jornal Contexto", "servicos"),
  i("JLM", "servicos", { observacao: "Sigla sem ramo informado; confirmar." }),
  i("Elefante Marketing", "consultoria"),
  i("Le Pétit Sable", "padarias-e-confeitarias", {
    observacao: "Confeitaria/patisserie.",
  }),
  i("Padaria Primazia", "padarias-e-confeitarias"),
  i("Espaço Scarpe", "moda-roupas-e-calcados"),
  i("Devorata", "restaurantes"),
  i("Chamonix Fondue", "restaurantes"),
  i("Plastivino", "lojas-em-geral", {
    observacao: "Ramo a confirmar na análise.",
  }),
  i("Mercado São Lucas", "supermercados-e-mercados"),
  i("Vanessa Lazzari — Arranjos", "presentes-e-artesanato", {
    responsavel: "Vanessa Lazzari",
    observacao: "Arranjos florais.",
  }),
  i("Casulo", "moda-roupas-e-calcados", {
    endereco: "Na avenida",
    observacao: 'Endereço citado como "na avenida"; confirmar.',
  }),
  i("Home Decor Zenilde", "casa-moveis-e-decoracao"),
  i("Meu Céu Gelatto", "acai-e-sorveterias"),
  i("Raquel Konrad", "servicos", {
    responsavel: "Raquel Konrad",
    observacao: "Influenciadora.",
  }),
  i("Carla Cogorni", "servicos", {
    responsavel: "Carla Cogorni",
    observacao: "Influenciadora.",
  }),
  i("Artelana", "presentes-e-artesanato", { observacao: "Artesanato em lã." }),
  i("Jornal NB", "servicos"),
];

/** Descreve o item para o snapshot da solicitação (texto neutro, sem inventar). */
export function descricaoDoItem(
  item: ItemImportado,
  nomeCategoria: string,
): string {
  const onde = item.cidade ?? BG;
  const ramo = nomeCategoria.toLowerCase();
  return `${ramo.charAt(0).toUpperCase()}${ramo.slice(1)} em ${onde}.`;
}
