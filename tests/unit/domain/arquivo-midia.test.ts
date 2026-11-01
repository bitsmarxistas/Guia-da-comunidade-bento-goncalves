import { describe, expect, it } from "vitest";
import {
  chaveDoUrlPublico,
  chaveValida,
  gerarChaveArmazenamento,
  LIMITE_ANEXO_BYTES,
  LIMITE_IMAGEM_BYTES,
  PREFIXO_SOLICITACAO_TEMP,
  validarUpload,
} from "@/domain/midia/arquivo";
import { normalizarMidiasEnviadas } from "@/domain/midia/arquivo";
import { podeExibirImagem } from "@/domain/midia/url-publica";

const BASE = "https://pub-exemplo.r2.dev";

describe("validarUpload", () => {
  it("aceita JPG, PNG e WebP dentro do limite", () => {
    for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) {
      const resultado = validarUpload("imagem", {
        mimeType,
        tamanhoBytes: 1024,
      });
      expect(resultado.valido).toBe(true);
    }
  });

  it("recusa PDF como foto", () => {
    const resultado = validarUpload("imagem", {
      mimeType: "application/pdf",
      tamanhoBytes: 1024,
    });

    expect(resultado).toEqual({
      valido: false,
      erro: "Formato não aceito. Envie JPG, PNG ou WebP.",
    });
  });

  it("recusa foto acima de 5 MB com frase em português", () => {
    const resultado = validarUpload("imagem", {
      mimeType: "image/jpeg",
      tamanhoBytes: LIMITE_IMAGEM_BYTES + 1,
    });

    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toContain("5 MB");
  });

  it("recusa arquivo vazio ou tamanho inválido", () => {
    expect(
      validarUpload("imagem", { mimeType: "image/png", tamanhoBytes: 0 })
        .valido,
    ).toBe(false);
    expect(
      validarUpload("imagem", { mimeType: "image/png", tamanhoBytes: "12" })
        .valido,
    ).toBe(false);
  });

  it("aceita PDF de anexo até 10 MB e recusa acima", () => {
    expect(
      validarUpload("anexo", {
        mimeType: "application/pdf",
        tamanhoBytes: LIMITE_ANEXO_BYTES,
      }).valido,
    ).toBe(true);

    expect(
      validarUpload("anexo", {
        mimeType: "application/pdf",
        tamanhoBytes: LIMITE_ANEXO_BYTES + 1,
      }).valido,
    ).toBe(false);
  });
});

describe("chave de armazenamento", () => {
  it("gera chave no prefixo com extensão do tipo", () => {
    const chave = gerarChaveArmazenamento(PREFIXO_SOLICITACAO_TEMP, "webp");

    expect(chave.startsWith(`${PREFIXO_SOLICITACAO_TEMP}/`)).toBe(true);
    expect(chave.endsWith(".webp")).toBe(true);
    expect(
      chaveValida(chave, {
        prefixos: [PREFIXO_SOLICITACAO_TEMP],
        finalidade: "imagem",
      }),
    ).toBe(true);
  });

  it("recusa chave de outro prefixo, com .. ou extensão proibida", () => {
    const opcoes = {
      prefixos: [PREFIXO_SOLICITACAO_TEMP],
      finalidade: "imagem" as const,
    };

    expect(chaveValida("negocios/abc/foto.webp", opcoes)).toBe(false);
    expect(chaveValida("solicitacoes/temp/../secreto.webp", opcoes)).toBe(
      false,
    );
    expect(chaveValida("solicitacoes/temp/foto.pdf", opcoes)).toBe(false);
    expect(chaveValida("", opcoes)).toBe(false);
  });

  it("recusa anexo com extensão de imagem", () => {
    expect(
      chaveValida(`${PREFIXO_SOLICITACAO_TEMP}/anexos/a.png`, {
        prefixos: [`${PREFIXO_SOLICITACAO_TEMP}/anexos`],
        finalidade: "anexo",
      }),
    ).toBe(false);
  });
});

describe("chaveDoUrlPublico", () => {
  it("extrai a chave de uma URL do bucket", () => {
    expect(chaveDoUrlPublico(`${BASE}/solicitacoes/temp/a-1.webp`, BASE)).toBe(
      "solicitacoes/temp/a-1.webp",
    );
  });

  it("aceita base com barra no fim", () => {
    expect(
      chaveDoUrlPublico(`${BASE}/solicitacoes/temp/a-1.webp`, `${BASE}/`),
    ).toBe("solicitacoes/temp/a-1.webp");
  });

  it("devolve null para outro domínio ou URL inválida", () => {
    expect(chaveDoUrlPublico("https://outro.site/a.webp", BASE)).toBeNull();
    expect(chaveDoUrlPublico("não é url", BASE)).toBeNull();
    expect(chaveDoUrlPublico(null, BASE)).toBeNull();
    expect(chaveDoUrlPublico(`${BASE}/a.webp`, undefined)).toBeNull();
  });
});

describe("normalizarMidiasEnviadas", () => {
  const envio = (extra: Record<string, unknown> = {}) => ({
    key: "solicitacoes/temp/abc-1.webp",
    url: `${BASE}/solicitacoes/temp/abc-1.webp`,
    fileName: "foto.webp",
    fileType: "image/webp",
    fileSize: 2048,
    tipo: "foto",
    ...extra,
  });

  const opcoes = {
    finalidade: "imagem" as const,
    maximo: 4,
    basePublica: BASE,
  };

  it("lê a lista enviada como JSON", () => {
    const resultado = normalizarMidiasEnviadas(
      JSON.stringify([envio()]),
      opcoes,
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.midias).toHaveLength(1);
      expect(resultado.midias[0]?.key).toBe("solicitacoes/temp/abc-1.webp");
      expect(resultado.midias[0]?.tipo).toBe("foto");
    }
  });

  it("descarta envio cuja URL é de outro domínio", () => {
    const resultado = normalizarMidiasEnviadas(
      JSON.stringify([
        { url: "https://site-malicioso.example/foto.webp" },
        {
          key: "solicitacoes/temp/ok.webp",
          url: "https://malicioso.example/x",
        },
      ]),
      opcoes,
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      // Sem chave válida o item cai; com chave válida a URL é reescrita para a
      // nossa base — nunca a do domínio de fora.
      expect(resultado.midias).toHaveLength(1);
      expect(resultado.midias[0]?.url).toBe(
        `${BASE}/solicitacoes/temp/ok.webp`,
      );
    }
  });

  it("descarta chave fora do prefixo público", () => {
    const resultado = normalizarMidiasEnviadas(
      JSON.stringify([envio({ key: "negocios/xyz/foto.webp" })]),
      opcoes,
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.midias).toHaveLength(0);
  });

  it("não repete a mesma chave e respeita o máximo", () => {
    const repetidas = Array.from({ length: 6 }, (_, i) =>
      envio({
        key: `solicitacoes/temp/foto-${i}.webp`,
        url: `${BASE}/solicitacoes/temp/foto-${i}.webp`,
      }),
    );

    const resultado = normalizarMidiasEnviadas(
      [...repetidas, repetidas[0]],
      opcoes,
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.midias).toHaveLength(4);
  });

  it("devolve lista vazia quando não há envio", () => {
    for (const vazio of [undefined, null, ""]) {
      const resultado = normalizarMidiasEnviadas(vazio, opcoes);
      expect(resultado.ok).toBe(true);
      if (resultado.ok) expect(resultado.midias).toHaveLength(0);
    }
  });

  it("recusa JSON quebrado", () => {
    const resultado = normalizarMidiasEnviadas("{nao é json", opcoes);
    expect(resultado.ok).toBe(false);
  });

  it("mantém anexos com metadados e prefixo próprio", () => {
    const anexo = {
      key: "solicitacoes/temp/anexos/doc-1.pdf",
      url: `${BASE}/solicitacoes/temp/anexos/doc-1.pdf`,
      fileName: "contrato.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
    };

    const resultado = normalizarMidiasEnviadas(JSON.stringify([anexo]), {
      finalidade: "anexo",
      maximo: 3,
      basePublica: BASE,
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.midias[0]?.nomeOriginal).toBe("contrato.pdf");
      expect(resultado.midias[0]?.mimeType).toBe("application/pdf");
      expect(resultado.midias[0]?.tamanhoBytes).toBe(1024);
    }
  });
});

describe("podeExibirImagem", () => {
  it("aceita o domínio público do bucket configurado", () => {
    expect(podeExibirImagem(`${BASE}/solicitacoes/temp/a.webp`, BASE)).toBe(
      true,
    );
  });

  it("aceita qualquer host r2.dev (bucket público)", () => {
    expect(podeExibirImagem("https://pub-outro.r2.dev/foto.webp", BASE)).toBe(
      true,
    );
  });

  it("recusa http, domínio estranho e valor vazio", () => {
    expect(podeExibirImagem("http://pub-outro.r2.dev/foto.webp", BASE)).toBe(
      false,
    );
    expect(
      podeExibirImagem("https://site-malicioso.example/foto.webp", BASE),
    ).toBe(false);
    expect(podeExibirImagem(null, BASE)).toBe(false);
    expect(podeExibirImagem("", BASE)).toBe(false);
  });

  it("aceita os hosts legados e o domínio do guia", () => {
    expect(
      podeExibirImagem("https://assets.seudominio.com.br/a.jpg", BASE),
    ).toBe(true);
    expect(podeExibirImagem("https://guiabg.com.br/a.jpg", BASE)).toBe(true);
  });
});
