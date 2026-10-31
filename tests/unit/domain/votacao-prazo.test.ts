// tests/unit/domain/votacao-prazo.test.ts
import { describe, it, expect } from "vitest";
import {
  DURACAO_VOTACAO_HORAS,
  calcularEncerramento,
  calcularHorasRestantes,
} from "@/domain/votacao/duracao";
import {
  apurarEncerramentoPorPrazo,
  votacaoVencida,
} from "@/domain/votacao/encerramento";
import type { VotoInfo } from "@/domain/state-machines/votacao";

const HORA_MS = 60 * 60 * 1000;

function criarVoto(
  adminId: string,
  escolha: "aprovacao" | "rejeicao",
  estado: "ativo" | "inativo" | "substituido" = "ativo",
  criadoEm = new Date("2026-01-01T00:00:00.000Z"),
): VotoInfo {
  return { adminId, escolha, estado, criadoEm };
}

describe("Duração fixa da votação", () => {
  it("define o prazo de produto em exatamente 24 horas", () => {
    expect(DURACAO_VOTACAO_HORAS).toBe(24);
  });

  it("calcula encerraEm como iniciadaEm + 24 h", () => {
    const iniciadaEm = new Date("2026-03-10T12:00:00.000Z");
    const encerraEm = calcularEncerramento(iniciadaEm);

    expect(encerraEm.toISOString()).toBe("2026-03-11T12:00:00.000Z");
    expect(encerraEm.getTime() - iniciadaEm.getTime()).toBe(24 * HORA_MS);
  });

  it("não altera a data de início recebida", () => {
    const iniciadaEm = new Date("2026-12-31T23:30:00.000Z");
    const original = iniciadaEm.getTime();

    calcularEncerramento(iniciadaEm);

    expect(iniciadaEm.getTime()).toBe(original);
  });

  it("atravessa a virada do ano somando 24 h absolutas", () => {
    const iniciadaEm = new Date("2026-12-31T23:00:00.000Z");

    expect(calcularEncerramento(iniciadaEm).toISOString()).toBe(
      "2027-01-01T23:00:00.000Z",
    );
  });

  describe("calcularHorasRestantes", () => {
    const agora = new Date("2026-01-01T00:00:00.000Z");

    it("devolve 24 h no instante da abertura", () => {
      expect(calcularHorasRestantes(calcularEncerramento(agora), agora)).toBe(
        24,
      );
    });

    it("arredonda para cima (30 min restantes = 1 h)", () => {
      expect(
        calcularHorasRestantes(
          new Date(agora.getTime() + 30 * 60 * 1000),
          agora,
        ),
      ).toBe(1);
      expect(
        calcularHorasRestantes(
          new Date(agora.getTime() + 90 * 60 * 1000),
          agora,
        ),
      ).toBe(2);
    });

    it("devolve 0 no limite e depois dele", () => {
      expect(calcularHorasRestantes(agora, agora)).toBe(0);
      expect(calcularHorasRestantes(new Date(agora.getTime() - 1), agora)).toBe(
        0,
      );
    });
  });
});

describe("Encerramento por tempo", () => {
  const agora = new Date("2026-01-02T00:00:00.000Z");

  it("não vence enquanto está em andamento e o prazo está no futuro", () => {
    expect(
      votacaoVencida(
        {
          situacao: "em_andamento",
          encerraEm: new Date(agora.getTime() + 1),
        },
        agora,
      ),
    ).toBe(false);
  });

  it("vence no instante exato do limite (encerraEm <= agora)", () => {
    expect(
      votacaoVencida({ situacao: "em_andamento", encerraEm: agora }, agora),
    ).toBe(true);
  });

  it("vence quando o prazo já passou", () => {
    expect(
      votacaoVencida(
        {
          situacao: "em_andamento",
          encerraEm: new Date(agora.getTime() - HORA_MS),
        },
        agora,
      ),
    ).toBe(true);
  });

  it("nunca recalcula votação já terminal", () => {
    const encerraEm = new Date(agora.getTime() - HORA_MS);

    expect(votacaoVencida({ situacao: "aprovada", encerraEm }, agora)).toBe(
      false,
    );
    expect(votacaoVencida({ situacao: "rejeitada", encerraEm }, agora)).toBe(
      false,
    );
    expect(
      votacaoVencida({ situacao: "sem_aprovacao", encerraEm }, agora),
    ).toBe(false);
  });
});

describe("apurarEncerramentoPorPrazo", () => {
  const admin1 = "admin-1";
  const admin2 = "admin-2";
  const admin3 = "admin-3";

  it("com quórum completo, aplica a maioria (aprovada)", () => {
    const votos = [
      criarVoto(admin1, "aprovacao"),
      criarVoto(admin2, "aprovacao"),
      criarVoto(admin3, "rejeicao"),
    ];

    const resultado = apurarEncerramentoPorPrazo(
      votos,
      new Set([admin1, admin2, admin3]),
    );

    expect(resultado).toEqual({
      situacao: "aprovada",
      aprovacoes: 2,
      rejeicoes: 1,
      totalVotos: 3,
      quorumCompleto: true,
    });
  });

  it("com quórum completo, aplica a maioria (rejeitada)", () => {
    const votos = [
      criarVoto(admin1, "rejeicao"),
      criarVoto(admin2, "rejeicao"),
      criarVoto(admin3, "aprovacao"),
    ];

    const resultado = apurarEncerramentoPorPrazo(
      votos,
      new Set([admin1, admin2, admin3]),
    );

    expect(resultado.situacao).toBe("rejeitada");
    expect(resultado.aprovacoes).toBe(1);
    expect(resultado.rejeicoes).toBe(2);
    expect(resultado.quorumCompleto).toBe(true);
  });

  it("com quórum completo e empate, encerra como sem_aprovacao", () => {
    const votos = [
      criarVoto(admin1, "aprovacao"),
      criarVoto(admin2, "rejeicao"),
    ];

    const resultado = apurarEncerramentoPorPrazo(
      votos,
      new Set([admin1, admin2]),
    );

    expect(resultado.situacao).toBe("sem_aprovacao");
    expect(resultado.aprovacoes).toBe(1);
    expect(resultado.rejeicoes).toBe(1);
    expect(resultado.quorumCompleto).toBe(true);
  });

  it("sem quórum completo, encerra como sem_aprovacao mantendo os votos", () => {
    const votos = [criarVoto(admin1, "aprovacao")];

    const resultado = apurarEncerramentoPorPrazo(
      votos,
      new Set([admin1, admin2, admin3]),
    );

    expect(resultado).toEqual({
      situacao: "sem_aprovacao",
      aprovacoes: 1,
      rejeicoes: 0,
      totalVotos: 1,
      quorumCompleto: false,
    });
  });

  it("sem nenhum voto, encerra como sem_aprovacao", () => {
    const resultado = apurarEncerramentoPorPrazo([], new Set([admin1, admin2]));

    expect(resultado).toEqual({
      situacao: "sem_aprovacao",
      aprovacoes: 0,
      rejeicoes: 0,
      totalVotos: 0,
      quorumCompleto: false,
    });
  });

  it("quórum vazio encerra como sem_aprovacao (sem quórum)", () => {
    const resultado = apurarEncerramentoPorPrazo([], new Set());

    expect(resultado).toEqual({
      situacao: "sem_aprovacao",
      aprovacoes: 0,
      rejeicoes: 0,
      totalVotos: 0,
      quorumCompleto: false,
    });
  });

  it("ignora votos inativos na contagem e no quórum", () => {
    const votos = [
      criarVoto(admin1, "aprovacao", "ativo"),
      criarVoto(admin2, "rejeicao", "inativo"),
    ];

    const resultado = apurarEncerramentoPorPrazo(
      votos,
      new Set([admin1, admin2]),
    );

    expect(resultado.situacao).toBe("sem_aprovacao");
    expect(resultado.aprovacoes).toBe(1);
    expect(resultado.rejeicoes).toBe(0);
    expect(resultado.quorumCompleto).toBe(false);
  });
});
