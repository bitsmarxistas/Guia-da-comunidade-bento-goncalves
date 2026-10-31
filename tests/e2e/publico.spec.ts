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
    await expect(page.getByText(/Rua Marechal Floriano/)).toBeVisible();
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
});
