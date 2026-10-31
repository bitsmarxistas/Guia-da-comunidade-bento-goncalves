import { describe, expect, it } from "vitest";
import {
  calcularAlteracoes,
  type CamposComparaveis,
} from "@/domain/solicitacoes/alteracoes";

const publicado: CamposComparaveis = {
  nome: "Padaria do Zé",
  descricao: "Pães e café",
  whatsapp: "54999990000",
  bairro: "Centro",
  endereco: "Rua Marechal Floriano",
  categorias: ["Padarias", "Cafeterias"],
};

describe("calcularAlteracoes (chamado de correção)", () => {
  it("devolve lista vazia quando nada mudou", () => {
    expect(calcularAlteracoes(publicado, { ...publicado })).toEqual([]);
  });

  it("ignora diferença de espaço no texto", () => {
    expect(
      calcularAlteracoes(publicado, {
        ...publicado,
        nome: "  Padaria do Zé  ",
      }),
    ).toEqual([]);
  });

  it("detecta mudança simples com o valor antigo e o novo", () => {
    const alteracoes = calcularAlteracoes(publicado, {
      ...publicado,
      descricao: "Pães, café e almoço",
    });

    expect(alteracoes).toHaveLength(1);
    expect(alteracoes[0]).toMatchObject({
      campo: "descricao",
      rotulo: "Descrição",
      de: "Pães e café",
      para: "Pães, café e almoço",
    });
  });

  it("compara categorias como conjunto, sem depender da ordem", () => {
    expect(
      calcularAlteracoes(publicado, {
        ...publicado,
        categorias: ["Cafeterias", "Padarias"],
      }),
    ).toEqual([]);
  });

  it("registra categorias removidas", () => {
    const alteracoes = calcularAlteracoes(publicado, {
      ...publicado,
      categorias: ["Padarias"],
    });

    expect(alteracoes).toHaveLength(1);
    expect(alteracoes[0]?.campo).toBe("categorias");
    expect(alteracoes[0]?.para).toBe("Padarias");
    expect(alteracoes[0]?.de).toContain("Cafeterias");
  });

  it("acumula vários campos alterados", () => {
    const alteracoes = calcularAlteracoes(publicado, {
      ...publicado,
      nome: "Padaria do Zé e Cia",
      whatsapp: "54988887777",
      bairro: "São Bento",
    });

    expect(alteracoes.map((a) => a.campo).sort()).toEqual([
      "bairro",
      "nome",
      "whatsapp",
    ]);
  });

  it("mantém o valor novo vazio quando o campo é apagado", () => {
    const alteracoes = calcularAlteracoes(publicado, {
      ...publicado,
      bairro: "",
    });

    expect(alteracoes).toHaveLength(1);
    expect(alteracoes[0]?.de).toBe("Centro");
    expect(alteracoes[0]?.para).toBe("");
  });
});
