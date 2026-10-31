// src/scripts/importar-lista-solicitacoes.ts
//
// Limpa os dados de demonstração e coloca a lista real na FILA DE APROVAÇÃO.
//
// Nada é publicado: cada item vira uma solicitação "recebida", que a equipe
// confere no painel e aprova (ou reprova). É o mesmo caminho do formulário
// público — o import não atalha a moderação.
//
// Uso:
//   pnpm db:importar:lista -- --limpar --confirmar
//   pnpm db:importar:lista -- --limpar --confirmar --dry-run
import { inArray, eq, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  aceiteTermo,
  anexo,
  categoria,
  contato,
  contestacao,
  forumPublicacao,
  horarioFuncionamento,
  imagem,
  localizacao,
  negocio,
  negocioCategoria,
  solicitacao,
  solicitante,
  sugestaoCategoria,
  votacao,
  voto,
} from "@/infrastructure/db/schema";
import { logSolicitacaoRecebida } from "@/infrastructure/db/schema/logs";
import { LISTA_WHATSAPP, descricaoDoItem } from "./importacao/lista-whatsapp";

const CONFIRMAR = process.argv.includes("--confirmar");
const LIMPAR = process.argv.includes("--limpar");
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Apaga o conteúdo de demonstração mantendo o que é configuração do guia:
 * categorias, administradores, documentos legais e parâmetros.
 */
async function limparConteudo() {
  // Ordem respeita as chaves estrangeiras.
  const passos: Array<[string, () => Promise<unknown>]> = [
    ["votos", () => db.delete(voto)],
    ["votações", () => db.delete(votacao)],
    ["contestações", () => db.delete(contestacao)],
    ["fórum", () => db.delete(forumPublicacao)],
    ["sugestões de categoria", () => db.delete(sugestaoCategoria)],
    ["aceites de termo", () => db.delete(aceiteTermo)],
    ["imagens", () => db.delete(imagem)],
    ["anexos", () => db.delete(anexo)],
    ["horários", () => db.delete(horarioFuncionamento)],
    ["contatos", () => db.delete(contato)],
    ["localizações", () => db.delete(localizacao)],
    ["vínculos de categoria", () => db.delete(negocioCategoria)],
    ["solicitações", () => db.delete(solicitacao)],
    ["negócios", () => db.delete(negocio)],
    ["solicitantes", () => db.delete(solicitante)],
  ];

  for (const [rotulo, acao] of passos) {
    if (DRY_RUN) {
      console.log(`  (dry-run) apagaria ${rotulo}`);
      continue;
    }
    await acao();
    console.log(`  ✓ ${rotulo}`);
  }
}

async function main() {
  if (!CONFIRMAR) {
    console.error(
      "Recusado: rode com --confirmar. Este script APAGA os dados de conteúdo do banco.",
    );
    process.exit(1);
  }

  if (LIMPAR) {
    console.log(`🧹 Limpando conteúdo${DRY_RUN ? " (dry-run)" : ""}…`);
    await limparConteudo();
  }

  const categorias = await db
    .select({ id: categoria.id, slug: categoria.slug, nome: categoria.nome })
    .from(categoria)
    .where(eq(categoria.ativa, true));
  const porSlug = new Map(categorias.map((c) => [c.slug, c]));

  const semCategoria = [
    ...new Set(LISTA_WHATSAPP.map((item) => item.categoria)),
  ].filter((slug) => !porSlug.has(slug));
  if (semCategoria.length > 0) {
    console.error("Categorias inexistentes na lista:", semCategoria.join(", "));
    process.exit(1);
  }

  console.log(
    `📥 Inserindo ${LISTA_WHATSAPP.length} pedido(s) na fila de aprovação…`,
  );

  // Um único solicitante identificando a origem da importação.
  const [origem] = DRY_RUN
    ? [{ id: "dry-run" }]
    : await db
        .insert(solicitante)
        .values({
          nome: "Importação — lista do WhatsApp (out/2026)",
          email: "importacao@guiabg.com.br",
          telefone: "555196156768",
        })
        .returning({ id: solicitante.id });

  if (!origem) throw new Error("falha ao criar o solicitante da importação");

  let criadas = 0;
  for (const item of LISTA_WHATSAPP) {
    const cat = porSlug.get(item.categoria);
    if (!cat) continue;

    const contatos = [
      item.instagram
        ? {
            tipo: "instagram",
            valor: item.instagram.replace(/^@/, ""),
            ordem: 0,
          }
        : null,
    ].filter((c): c is { tipo: string; valor: string; ordem: number } =>
      Boolean(c),
    );

    const dados = {
      nome: item.nome,
      descricao: descricaoDoItem(item, cat.nome),
      contatos,
      categoriasIds: [cat.id],
      localizacao: {
        endereco: item.endereco ?? "",
        bairro: item.bairro ?? "",
        areaAtendimento: item.cidade ?? "Bento Gonçalves",
      },
      fonte: "importacao-whatsapp",
      importadoEm: "2026-10-27",
      responsavel: item.responsavel ?? null,
      observacao: item.observacao ?? null,
    };

    if (DRY_RUN) {
      criadas++;
      continue;
    }

    const [nova] = await db
      .insert(solicitacao)
      .values({
        solicitanteId: origem.id,
        tipo: "inclusao",
        situacao: "recebida",
        declaracaoVinculo: `Importação de lista de contatos (${item.nome}).`,
        dadosNegocioProposto: dados,
        duplicataDetectada: false,
      })
      .returning({ id: solicitacao.id });

    if (!nova) throw new Error(`falha ao criar solicitação de ${item.nome}`);

    await db.insert(logSolicitacaoRecebida).values({
      atorTipo: "sistema",
      solicitacaoId: nova.id,
      tipo: "inclusao",
    });

    criadas++;
  }

  console.log(`✅ ${criadas} pedido(s) na fila (situação "recebida").`);

  if (!DRY_RUN) {
    const [total] = await db
      .select({ t: sql<number>`count(*)::int` })
      .from(solicitacao)
      .where(inArray(solicitacao.situacao, ["recebida"]));
    console.log(`   Fila de aprovação agora tem ${total?.t ?? 0} pedido(s).`);
  }

  process.exit(0);
}

main().catch((erro) => {
  console.error("falha na importação:", erro);
  process.exit(1);
});
