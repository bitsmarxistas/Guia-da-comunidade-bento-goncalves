import { expect, test } from "@playwright/test";

/**
 * Envio de fotos pelo formulário público.
 *
 * O teste não fala com o R2 de verdade: a URL assinada é gerada pelo servidor
 * (cálculo local, sem rede) e o PUT para o bucket é interceptado. O que se
 * prova aqui é o que quebrou na prática — a foto sair da tela, subir e voltar
 * com chave/URL para o formulário, em vez de virar um preview local que nunca
 * chegava ao banco.
 */

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("fotos do formulário público", () => {
  test("visitante não vê chamada para entrar", async ({ page }) => {
    // Menu mobile: em 390 px o botão do topo aparece e o menu abre.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Nada de "Entrar" no topo: o guia não pede conta para ser usado.
    await expect(
      page.getByRole("link", { name: "Entrar", exact: true }),
    ).toHaveCount(0);

    // O menu mobile também não oferece login.
    await page.getByRole("button", { name: /Abrir menu/i }).click();
    await expect(
      page
        .getByRole("navigation", { name: /mobile/i })
        .getByRole("link", { name: /entrar|login|painel/i }),
    ).toHaveCount(0);

    // A equipe continua achando o painel pelo rodapé, sem convite a login.
    await expect(
      page.getByRole("link", { name: /Painel da equipe/i }),
    ).toHaveCount(1);
  });

  test("o painel continua acessível pela URL direta", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
  });

  test("envia a foto e ela volta com URL do bucket", async ({ page }) => {
    // PUT no R2: responde 200 sem sair para a internet.
    await page.route("**/*.r2.cloudflarestorage.com/**", (rota) =>
      rota.fulfill({ status: 200, body: "" }),
    );

    const pedidosDeAssinatura: string[] = [];
    page.on("request", (requisicao) => {
      if (requisicao.url().includes("/api/media/upload-url")) {
        pedidosDeAssinatura.push(requisicao.postData() ?? "");
      }
    });

    await page.goto("/solicitar");

    await page.getByLabel(/Nome do comércio/i).fill("Café de Teste E2E");
    await page
      .getByLabel(/Descrição/i)
      .fill(
        "Cafeteria de bairro com café coado, bolos caseiros e mesas na calçada para conversar.",
      );
    await page.getByText("Cafeterias", { exact: true }).click();
    await page.getByRole("button", { name: /Continuar/i }).click();

    await page.getByLabel(/Seu nome/i).fill("Maria Souza");
    await page.getByLabel(/^E-mail/i).fill("maria@exemplo.com");
    await page.getByLabel(/WhatsApp do comércio/i).fill("(54) 99999-0000");
    await page.getByText(/Sem ponto comercial/i).click();
    await page.getByLabel(/Bairro/i).fill("Centro");
    await page.getByRole("button", { name: /Continuar/i }).click();

    await expect(page.getByRole("heading", { name: /^Fotos$/i })).toBeVisible();

    await page.locator("#image-upload").setInputFiles({
      name: "fachada.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });

    await expect(page.getByText(/1\/4 fotos enviadas/i)).toBeVisible({
      timeout: 20_000,
    });

    // A foto viajou para o bucket e voltou com URL nossa, não com o preview
    // local (blob:) que o componente antigo mandava.
    expect(pedidosDeAssinatura.length).toBeGreaterThan(0);
    expect(pedidosDeAssinatura[0]).toContain('"finalidade":"imagem"');
    await expect(page.getByText(/Não foi enviada/i)).toHaveCount(0);
  });
});
