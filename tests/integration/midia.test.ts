import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

vi.mock("@/lib/audit-context", () => ({
  exigirContextoAdmin: async () => ({
    atorTipo: "admin",
    atorId: "00000000-0000-4000-8000-000000000001",
    ipOrigem: null,
    userAgent: null,
  }),
  contextoDaRequisicao: async (atorTipo: string) => ({
    atorTipo,
    atorId: null,
    ipOrigem: null,
    userAgent: null,
  }),
}));

vi.mock("@/infrastructure/email/client", () => ({
  enviarEmailAnaliseSolicitacao: async () => ({ success: true }),
}));

vi.mock("@/infrastructure/email/participacao", () => ({
  notificarSolicitacaoRecebida: async () => ({ success: true }),
}));

// O objeto no bucket é simulado: o teste não fala com o R2 de verdade.
vi.mock("@/infrastructure/r2/client", () => ({
  objetoExiste: async () => true,
  assinarUpload: async (chave: string) => ({
    uploadUrl: "https://exemplo.invalido/upload",
    key: chave,
    publicUrl: `https://pub-exemplo.r2.dev/${chave}`,
    expiresIn: 900,
  }),
  urlPublicaDaChave: (chave: string) => `https://pub-exemplo.r2.dev/${chave}`,
  deleteFile: async () => ({ success: true }),
}));

vi.mock("@/lib/auth", () => ({
  getAdmin: async () => ({
    id: "00000000-0000-4000-8000-000000000001",
    nome: "Admin de Teste",
    email: "admin.teste@guiabg.com.br",
  }),
}));

import { db } from "@/infrastructure/db/client";
import { imagem, negocio } from "@/infrastructure/db/schema";
import { buscarNegocios } from "@/application/catalogo";
import { buscarNegocioPorSlug } from "@/application/negocios/listar";
import { logImagem } from "@/infrastructure/db/schema/logs";
import { POST as moderar } from "@/app/api/admin/imagens/[id]/moderar/route";
import {
  criarAdmin,
  criarNegocio,
  criarSolicitacaoComPii,
  limparBanco,
} from "./setup";

/**
 * Fotos enviadas pelo site.
 *
 * Cobre o defeito relatado em 2026-11: o upload "funcionava" na tela, mas nada
 * chegava ao banco — `imagem.negocio_id` era NOT NULL e o comércio só nasce na
 * aprovação, então não havia como gravar a foto do pedido, a fila de moderação
 * ficava vazia e a imagem aprovada nunca aparecia na ficha.
 */

const URL_BUCKET = "https://pub-exemplo.r2.dev";

async function criarImagem(dados: {
  negocioId?: string | null;
  solicitacaoId?: string | null;
  situacao?: string;
  tipo?: string;
  url?: string;
}) {
  const [linha] = await db
    .insert(imagem)
    .values({
      negocioId: dados.negocioId ?? null,
      solicitacaoId: dados.solicitacaoId ?? null,
      tipo: dados.tipo ?? "foto",
      situacao: dados.situacao ?? "pendente",
      url: dados.url ?? `${URL_BUCKET}/solicitacoes/temp/foto.webp`,
    })
    .returning();

  return linha!;
}

describe("imagem de solicitação", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  it("grava foto presa à solicitação, antes de existir comércio", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();

    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    expect(foto.negocioId).toBeNull();
    expect(foto.situacao).toBe("pendente");
  });

  it("recusa imagem sem comércio e sem solicitação", async () => {
    await expect(criarImagem({})).rejects.toThrow();
  });

  it("aceita foto de comércio existente", async () => {
    const negocio = await criarNegocio({
      slug: "atelie-da-maria",
      nome: "Ateliê da Maria",
    });

    const foto = await criarImagem({ negocioId: negocio.id });

    expect(foto.negocioId).toBe(negocio.id);
  });
});

describe("exibição pública da foto", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  it("ficha mostra só a foto aprovada", async () => {
    const negocio = await criarNegocio({
      slug: "padaria-do-ze",
      nome: "Padaria do Zé",
    });

    await criarImagem({ negocioId: negocio.id, situacao: "aprovada" });
    await criarImagem({ negocioId: negocio.id, situacao: "pendente" });
    await criarImagem({ negocioId: negocio.id, situacao: "rejeitada" });

    const ficha = await buscarNegocioPorSlug("padaria-do-ze");

    expect(ficha?.imagens).toHaveLength(1);
  });

  it("card do catálogo não pega foto de solicitação sem comércio", async () => {
    const negocio = await criarNegocio({
      slug: "padaria-do-ze",
      nome: "Padaria do Zé",
    });
    const { solicitacao } = await criarSolicitacaoComPii();

    await criarImagem({
      solicitacaoId: solicitacao.id,
      situacao: "aprovada",
      url: `${URL_BUCKET}/solicitacoes/temp/solta.webp`,
    });
    await criarImagem({ negocioId: negocio.id, situacao: "aprovada" });

    const { negocios } = await buscarNegocios();

    expect(negocios[0]?.imagens).toHaveLength(1);
    expect(negocios[0]?.imagens[0]?.url).not.toContain("solta");
  });
});

describe("moderação de imagem (rota do painel)", () => {
  beforeEach(async () => {
    await limparBanco();
    await criarAdmin("admin.teste@guiabg.com.br");
  });

  async function chamarModeracao(
    id: string,
    corpo: Record<string, unknown>,
  ): Promise<Response> {
    const requisicao = new Request(
      `http://localhost/api/admin/imagens/${id}/moderar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      },
    );

    return moderar(requisicao as never, {
      params: Promise.resolve({ id }),
    });
  }

  it("aprova a foto pendente e registra auditoria", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    const resposta = await chamarModeracao(foto.id, {
      acao: "aprovar",
      tipo: "imagem",
    });

    expect(resposta.status).toBe(200);

    const [atualizada] = await db
      .select({ situacao: imagem.situacao })
      .from(imagem)
      .where(eq(imagem.id, foto.id));

    expect(atualizada?.situacao).toBe("aprovada");

    const logs = await db
      .select({ acao: logImagem.acao })
      .from(logImagem)
      .where(eq(logImagem.imagemId, foto.id));

    expect(logs.map((linha) => linha.acao)).toContain("aprovar");
  });

  it("rejeitar exige justificativa", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    const resposta = await chamarModeracao(foto.id, {
      acao: "rejeitar",
      tipo: "imagem",
    });

    expect(resposta.status).toBe(400);
  });

  it("rejeitar guarda o motivo", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    const resposta = await chamarModeracao(foto.id, {
      acao: "rejeitar",
      tipo: "imagem",
      justificativa: "Foto com marca d'água de outro site",
    });

    expect(resposta.status).toBe(200);

    const [atualizada] = await db
      .select({
        situacao: imagem.situacao,
        justificativa: imagem.justificativaRejeicao,
      })
      .from(imagem)
      .where(eq(imagem.id, foto.id));

    expect(atualizada?.situacao).toBe("rejeitada");
    expect(atualizada?.justificativa).toContain("marca d'água");
  });
});
describe("criação da solicitação com fotos", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  function formularioComFotos(imagens?: unknown): FormData {
    const formData = new FormData();
    formData.append("nomeSolicitante", "Maria Souza");
    formData.append("email", "maria@exemplo.com");
    formData.append("telefone", "");
    formData.append("nomeNegocio", "Ateliê da Maria");
    formData.append(
      "descricao",
      "Costura criativa, reparos de roupa e bordado feito à mão no centro.",
    );
    formData.append(
      "contatos",
      JSON.stringify([{ tipo: "whatsapp", valor: "54988887777", ordem: 0 }]),
    );
    formData.append("declaracaoVinculo", "Sou proprietária do negócio");
    formData.append("aceiteTermos", "true");
    formData.append(
      "imagens",
      JSON.stringify([
        {
          key: "solicitacoes/temp/foto-1.webp",
          url: `${URL_BUCKET}/solicitacoes/temp/foto-1.webp`,
          fileName: "fachada.webp",
          fileType: "image/webp",
          fileSize: 2048,
          tipo: "foto",
        },
      ]),
    );
    if (imagens) {
      formData.set("imagens", JSON.stringify(imagens));
    }
    return formData;
  }

  it("grava a foto pendente junto com a solicitação", async () => {
    const { criarSolicitacaoAction } =
      await import("@/application/solicitacoes/criar");

    const resultado = await criarSolicitacaoAction(null, formularioComFotos());

    expect("error" in resultado).toBe(false);
    if ("error" in resultado) return;

    const fotos = await db
      .select({
        solicitacaoId: imagem.solicitacaoId,
        negocioId: imagem.negocioId,
        situacao: imagem.situacao,
        url: imagem.url,
      })
      .from(imagem);

    expect(fotos).toHaveLength(1);
    expect(fotos[0]?.solicitacaoId).toBe(resultado.solicitacao.id);
    expect(fotos[0]?.negocioId).toBeNull();
    expect(fotos[0]?.situacao).toBe("pendente");
    expect(fotos[0]?.url).toContain("/solicitacoes/temp/foto-1.webp");
  });

  it("ignora foto com URL de outro site", async () => {
    const { criarSolicitacaoAction } =
      await import("@/application/solicitacoes/criar");

    await criarSolicitacaoAction(
      null,
      formularioComFotos([
        {
          key: "solicitacoes/temp/foto-1.webp",
          url: "https://site-malicioso.example/foto.webp",
          tipo: "foto",
        },
      ]),
    );

    // A chave é válida, então o registro entra — mas com a URL reescrita para o
    // nosso bucket, nunca com a do domínio de fora.
    const fotos = await db.select({ url: imagem.url }).from(imagem);

    expect(fotos).toHaveLength(1);
    expect(fotos[0]?.url.startsWith(URL_BUCKET)).toBe(true);
  });
});
describe("aprovação do cadastro libera as fotos do pedido", () => {
  beforeEach(async () => {
    await limparBanco();
    await criarAdmin("admin.teste@guiabg.com.br");
  });

  async function decidir(solicitacaoId: string, decisao: string) {
    const formData = new FormData();
    formData.append("solicitacaoId", solicitacaoId);
    formData.append("decisao", decisao);
    if (decisao !== "aprovar") {
      formData.append("justificativa", "Falta informação no pedido");
    }

    const { analisarSolicitacaoAction } =
      await import("@/application/solicitacoes/analise");

    return analisarSolicitacaoAction(null, formData);
  }

  it("aprovar o cadastro vincula e publica a foto enviada", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    const resultado = await decidir(solicitacao.id, "aprovar");
    expect("error" in resultado).toBe(false);

    const [depois] = await db
      .select({ negocioId: imagem.negocioId, situacao: imagem.situacao })
      .from(imagem)
      .where(eq(imagem.id, foto.id));

    expect(depois?.situacao).toBe("aprovada");
    expect(depois?.negocioId).toBeTruthy();

    // E a ficha pública já mostra a foto aprovada.
    const [negocioCriado] = await db
      .select({ slug: negocio.slug })
      .from(negocio)
      .where(eq(negocio.id, depois!.negocioId!));

    const ficha = await buscarNegocioPorSlug(negocioCriado!.slug);
    expect(ficha?.imagens).toHaveLength(1);
  });

  it("foto rejeitada antes da aprovação não volta a ser publicada", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({
      solicitacaoId: solicitacao.id,
      situacao: "rejeitada",
    });

    await decidir(solicitacao.id, "aprovar");

    const [depois] = await db
      .select({ situacao: imagem.situacao })
      .from(imagem)
      .where(eq(imagem.id, foto.id));

    expect(depois?.situacao).toBe("rejeitada");
  });

  it("reprovar o cadastro não publica a foto", async () => {
    const { solicitacao } = await criarSolicitacaoComPii();
    const foto = await criarImagem({ solicitacaoId: solicitacao.id });

    await decidir(solicitacao.id, "reprovar");

    const [depois] = await db
      .select({ situacao: imagem.situacao })
      .from(imagem)
      .where(eq(imagem.id, foto.id));

    expect(depois?.situacao).toBe("pendente");
  });
});
