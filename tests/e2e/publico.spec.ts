import { expect, test } from "@playwright/test";

/**
 * F4/F3 — fluxo público. Cobre o que o visitante faz sem sessão:
 * descobrir o catálogo, filtrar, buscar, abrir a página do comércio e começar
 * o wizard de participação.
 * Depende do seed (`pnpm db:seed:completo`), que cria "Padaria do Zé".
 */
test.describe("catálogo público", () => {
  test("home responde e mostra a chamada principal", async ({ page }) => {
    const resposta = await page.goto("/");

    expect(resposta?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /muda a comunidade/i,
    );
    await expect(
      page.getByRole("link", { name: /Participar do guia/i }).first(),
    ).toBeVisible();
  });

  test("catálogo lista comércios publicados", async ({ page }) => {
    await page.goto("/catalogo");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /catálogo/i,
    );
    await expect(page.getByText("Padaria do Zé").first()).toBeVisible();
  });

  test("filtro por categoria reduz o resultado pela URL", async ({ page }) => {
    await page.goto("/catalogo?categoria=pizzarias");

    await expect(page.getByText("Pizzaria Bella Napoli").first()).toBeVisible();
    await expect(page.getByText("Padaria do Zé")).toHaveCount(0);
  });

  test("busca sem acento encontra o comércio", async ({ page }) => {
    await page.goto("/busca?q=padaria");

    await expect(page.getByText("Padaria do Zé").first()).toBeVisible();
  });

  test("página do comércio mostra contatos e endereço", async ({ page }) => {
    const resposta = await page.goto("/negocio/padaria-do-ze");

    expect(resposta?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Padaria do Zé/i,
    );
    await expect(
      page.getByRole("heading", { name: /^Contatos$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Falar no WhatsApp/i }),
    ).toBeVisible();

    // O endereço aparece na ficha (informações) e no bloco do mapa: a asserção
    // é no bloco "Onde fica", que também prova o mapa e o link de rota.
    const ondeFica = page.getByRole("region", { name: /Onde fica/i });
    await expect(ondeFica.getByText(/Rua Marechal Floriano/)).toBeVisible();
    await expect(
      ondeFica.getByRole("link", { name: /Abrir no mapa/i }),
    ).toBeVisible();

    // Horário de funcionamento junto das informações do comércio.
    await expect(page.getByText(/Horário de hoje/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Horários$/i }),
    ).toBeVisible();
  });

  test("slug inexistente responde 404", async ({ page }) => {
    const resposta = await page.goto("/negocio/nao-existe-essa-padaria");

    expect(resposta?.status()).toBe(404);
  });

  test("wizard avança e exige e-mail na etapa de contato", async ({ page }) => {
    await page.goto("/solicitar");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /comércio/i,
    );

    await page.getByLabel(/Nome do comércio/i).fill("Comércio de Teste E2E");
    await page
      .getByLabel(/Descrição/i)
      .fill(
        "Descrição com mais de quarenta caracteres para passar da primeira etapa do formulário público do guia.",
      );
    await page.getByText("Cafeterias", { exact: true }).click();
    await page.getByRole("button", { name: /Continuar/i }).click();

    await expect(page.getByLabel(/^E-mail/i)).toBeVisible();
    await expect(
      page.getByText(/A resposta da análise chega neste e-mail/i),
    ).toBeVisible();
  });

  test("carrossel é coerente com o transbordo e o tema alterna", async ({
    page,
  }) => {
    await page.goto("/");

    const trilho = page.getByRole("region", {
      name: /Comércios em destaque/i,
    });
    const avancar = page.getByRole("button", { name: /Ver mais comércios/i });

    // A base de E2E pode ter poucos comércios para rolar. O contrato é: seta
    // liberada se existe conteúdo escondido à direita — e travada se não existe.
    const transbordo = await trilho.evaluate(
      (elemento) => elemento.scrollWidth - elemento.clientWidth,
    );

    if (transbordo > 8) {
      await expect(avancar).toBeEnabled();

      // Rolar o trilho (o mesmo que a seta faz) tem de acender a seta de voltar
      // e apagar a de avançar no fim. Evita clique frágil em botão que muda de
      // estado no meio da animação.
      await trilho.evaluate((el) => el.scrollBy({ left: 320 }));
      await expect
        .poll(() => trilho.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
      await expect(
        page.getByRole("button", { name: /Ver comércios anteriores/i }),
      ).toBeEnabled();

      await trilho.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
      await expect(avancar).toBeDisabled();
    } else {
      await expect(avancar).toBeDisabled();
    }

    await page.getByRole("button", { name: "Alternar tema" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
