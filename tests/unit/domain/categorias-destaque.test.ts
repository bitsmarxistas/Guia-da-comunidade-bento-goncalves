import { describe, expect, it } from "vitest";
import {
  dividirCategorias,
  type CategoriaComTotal,
} from "@/domain/catalogo/categorias-destaque";

const cat = (
  nome: string,
  slug: string,
  total: number,
  oculta = false,
): CategoriaComTotal => ({ id: slug, nome, slug, oculta, total });

describe("dividirCategorias (home)", () => {
  it("põe na frente as categorias com mais comércio", () => {
    const { principais } = dividirCategorias([
      cat("Padarias", "padarias-e-confeitarias", 9),
      cat("Restaurantes", "restaurantes", 5),
      cat("Bancos", "bancos", 0),
    ]);

    expect(principais[0]?.slug).toBe("padarias-e-confeitarias");
    expect(principais[1]?.slug).toBe("restaurantes");
  });

  it("esconde o resto atrás do botão", () => {
    const categorias = Array.from({ length: 40 }, (_, i) =>
      cat("Categoria " + i, "cat-" + i, i),
    );

    const { principais, restantes } = dividirCategorias(categorias, 10);

    expect(principais).toHaveLength(10);
    expect(restantes).toHaveLength(30);
    // Nenhuma categoria some: principais + restantes = todas.
    expect(principais.length + restantes.length).toBe(categorias.length);
  });

  it("não repete categoria entre os dois blocos", () => {
    const categorias = Array.from({ length: 30 }, (_, i) =>
      cat("Categoria " + i, "cat-" + i, 30 - i),
    );

    const { principais, restantes } = dividirCategorias(categorias, 12);
    const slugs = [...principais, ...restantes].map((c) => c.slug);

    expect(new Set(slugs).size).toBe(categorias.length);
  });

  it("sempre respeita a marcação manual de oculta", () => {
    const { principais, restantes } = dividirCategorias([
      cat("Padarias", "padarias-e-confeitarias", 10, true),
      cat("Restaurantes", "restaurantes", 3),
    ]);

    expect(principais.map((c) => c.slug)).not.toContain(
      "padarias-e-confeitarias",
    );
    expect(restantes.map((c) => c.slug)).toContain("padarias-e-confeitarias");
  });

  it("completa com as categorias de base que existem no banco", () => {
    const { principais } = dividirCategorias([
      cat("Restaurantes", "restaurantes", 2),
      cat("Padarias e confeitarias", "padarias-e-confeitarias", 0),
      cat("Cafeterias", "cafeterias", 0),
    ]);

    // A que tem comércio vem primeiro; a base preenche o resto.
    expect(principais[0]?.slug).toBe("restaurantes");
    expect(principais.map((c) => c.slug)).toContain("padarias-e-confeitarias");
    expect(principais.map((c) => c.slug)).toContain("cafeterias");
  });
});
