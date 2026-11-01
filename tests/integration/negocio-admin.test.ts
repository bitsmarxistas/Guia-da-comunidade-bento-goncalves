import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  contato,
  horarioFuncionamento,
  localizacao,
  negocio,
} from "@/infrastructure/db/schema";
import { criarNegocioAction } from "@/application/negocios/criar";
import { editarNegocioAction } from "@/application/negocios/editar";
import { criarCategoria, limparBanco } from "./setup";

/**
 * Editor da ficha no painel.
 *
 * Cobre a paridade com o wizard público: o formulário do admin precisa gravar
 * os mesmos campos que o solicitante envia (CEP, número, "sem ponto
 * comercial", área de atendimento, e-mail, site e intervalo de almoço). Antes
 * ele só tinha rua e bairro soltos.
 */

function formDataDeNegocio(dados: {
  nome?: string;
  descricao?: string;
  contatos: Array<{ tipo: string; valor: string; ordem: number }>;
  localizacao: Record<string, unknown>;
  horarios: Array<Record<string, unknown>>;
  categoriasIds: string[];
  id?: string;
}) {
  const formData = new FormData();
  if (dados.id) formData.append("id", dados.id);
  formData.append("nome", dados.nome ?? "Café do Beco");
  formData.append(
    "descricao",
    dados.descricao ?? "Cafeteria de bairro com café coado e bolos caseiros.",
  );
  formData.append("contatos", JSON.stringify(dados.contatos));
  formData.append("localizacao", JSON.stringify(dados.localizacao));
  formData.append("horarios", JSON.stringify(dados.horarios));
  for (const id of dados.categoriasIds) {
    formData.append("categoriasIds", id);
  }
  return formData;
}

const INTERVALO = (diaSemana: number) => [
  {
    diaSemana,
    horaAbertura: "08:00",
    horaFechamento: "12:00",
    observacao: "",
  },
  {
    diaSemana,
    horaAbertura: "13:00",
    horaFechamento: "18:00",
    observacao: "",
  },
];

describe("editor de comércio do painel", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  it("cria comércio com CEP, número, área, site e intervalo", async () => {
    const categoria = await criarCategoria("cafeterias", "Cafeterias");

    const resultado = await criarNegocioAction(
      null,
      formDataDeNegocio({
        contatos: [
          { tipo: "whatsapp", valor: "54999998888", ordem: 0 },
          { tipo: "site", valor: "cafedobeco.com.br", ordem: 1 },
          { tipo: "email", valor: "contato@cafedobeco.com.br", ordem: 2 },
        ],
        localizacao: {
          cep: "95700000",
          numero: "123",
          endereco: "Rua Marechal Deodoro",
          bairro: "Centro",
          areaAtendimento: "Bento Gonçalves e região",
          semPontoComercial: false,
        },
        horarios: INTERVALO(1),
        categoriasIds: [categoria.id],
      }),
    );

    expect("error" in resultado).toBe(false);
    if ("error" in resultado) return;

    const [criado] = await db
      .select()
      .from(negocio)
      .where(eq(negocio.id, resultado.negocio.id));

    const [loc] = await db
      .select()
      .from(localizacao)
      .where(eq(localizacao.negocioId, criado!.id));

    expect(loc?.cep).toBe("95700000");
    expect(loc?.numero).toBe("123");
    expect(loc?.areaAtendimento).toBe("Bento Gonçalves e região");

    const contatos = await db
      .select({ tipo: contato.tipo, valor: contato.valor })
      .from(contato)
      .where(eq(contato.negocioId, criado!.id));

    expect(contatos.map((c) => c.tipo).sort()).toEqual([
      "email",
      "site",
      "whatsapp",
    ]);

    const horarios = await db
      .select({
        dia: horarioFuncionamento.diaSemana,
        abre: horarioFuncionamento.horaAbertura,
        fecha: horarioFuncionamento.horaFechamento,
      })
      .from(horarioFuncionamento)
      .where(eq(horarioFuncionamento.negocioId, criado!.id));

    expect(horarios).toHaveLength(2);
    expect(horarios.map((h) => h.abre.slice(0, 5))).toEqual(["08:00", "13:00"]);
  });

  it("edita endereço e contatos sem apagar o que não mudou", async () => {
    const categoria = await criarCategoria("cafeterias", "Cafeterias");
    const criado = await criarNegocioAction(
      null,
      formDataDeNegocio({
        contatos: [{ tipo: "whatsapp", valor: "54999998888", ordem: 0 }],
        localizacao: {
          endereco: "Rua Antiga",
          bairro: "Centro",
          areaAtendimento: "Bento Gonçalves",
        },
        horarios: INTERVALO(2),
        categoriasIds: [categoria.id],
      }),
    );

    if ("error" in criado) throw new Error(criado.error);

    const editado = await editarNegocioAction(
      null,
      formDataDeNegocio({
        id: criado.negocio.id,
        nome: "Café do Beco — novo",
        contatos: [
          { tipo: "whatsapp", valor: "54999998888", ordem: 0 },
          { tipo: "instagram", valor: "cafedobeco", ordem: 1 },
        ],
        localizacao: {
          cep: "95700001",
          numero: "45",
          endereco: "Rua Nova",
          bairro: "Cidade Alta",
          areaAtendimento: "Bento Gonçalves",
          semPontoComercial: false,
        },
        horarios: INTERVALO(2),
        categoriasIds: [categoria.id],
      }),
    );

    expect("error" in editado).toBe(false);

    const [loc] = await db
      .select()
      .from(localizacao)
      .where(eq(localizacao.negocioId, criado.negocio.id));

    expect(loc?.endereco).toBe("Rua Nova");
    expect(loc?.numero).toBe("45");
    expect(loc?.cep).toBe("95700001");
    expect(loc?.bairro).toBe("Cidade Alta");

    const contatos = await db
      .select({ tipo: contato.tipo })
      .from(contato)
      .where(eq(contato.negocioId, criado.negocio.id));

    expect(contatos.map((c) => c.tipo).sort()).toEqual([
      "instagram",
      "whatsapp",
    ]);

    const [depois] = await db
      .select({ nome: negocio.nome })
      .from(negocio)
      .where(eq(negocio.id, criado.negocio.id));

    expect(depois?.nome).toBe("Café do Beco — novo");
  });

  it("marca 'sem ponto comercial' e limpa rua e número", async () => {
    const categoria = await criarCategoria("consultoria", "Consultoria");
    const criado = await criarNegocioAction(
      null,
      formDataDeNegocio({
        contatos: [{ tipo: "whatsapp", valor: "54999998888", ordem: 0 }],
        localizacao: {
          endereco: "Rua Qualquer",
          numero: "10",
          bairro: "Centro",
        },
        horarios: INTERVALO(3),
        categoriasIds: [categoria.id],
      }),
    );

    if ("error" in criado) throw new Error(criado.error);

    await editarNegocioAction(
      null,
      formDataDeNegocio({
        id: criado.negocio.id,
        contatos: [{ tipo: "whatsapp", valor: "54999998888", ordem: 0 }],
        localizacao: {
          endereco: "",
          numero: "",
          bairro: "Centro",
          semPontoComercial: true,
          areaAtendimento: "Bento Gonçalves e região",
        },
        horarios: INTERVALO(3),
        categoriasIds: [categoria.id],
      }),
    );

    const [loc] = await db
      .select()
      .from(localizacao)
      .where(eq(localizacao.negocioId, criado.negocio.id));

    expect(loc?.semPontoComercial).toBe(true);
    expect(loc?.endereco).toBeNull();
    expect(loc?.numero).toBeNull();
    expect(loc?.areaAtendimento).toBe("Bento Gonçalves e região");
  });
});
