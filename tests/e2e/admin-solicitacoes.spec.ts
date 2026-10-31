import { expect, test } from "@playwright/test";

const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@guiabg.com.br",
  senha: process.env.E2E_ADMIN_SENHA ?? "Guiabg@2024!",
};

/**
 * Regressões do painel de solicitações.
 *
 * 1. O card do catálogo usa `after:absolute after:inset-0` para ser clicável
 *    por inteiro. Sem `relative` no ancestral, esse ::after cobria a página e
 *    engolia o clique nos filtros (foi o "os filtros não funcionam").
 * 2. A decisão só era liberada em "recebida"/"em_fila_contestacao": qualquer
 *    solicitação em análise aparecia como "Já analisada" e não podia ser
 *    aprovada.
 */
test.describe("painel de solicitações", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Senha").fill(ADMIN.senha);
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
  });

  test("filtro por situação encontra solicitações em análise", async ({
    page,
  }) => {
    await page.goto("/admin/solicitacoes?situacao=em_analise");

    await expect(
      page.getByRole("heading", { level: 1, name: /Solicitações/i }),
    ).toBeVisible();

    // A lista não pode mostrar "N/A" nem o estado cru do banco.
    const tabela = page.locator("table tbody");
    await expect(tabela).not.toContainText("N/A");
    await expect(tabela).not.toContainText("em_analise");
    await expect(tabela.getByText(/Em análise/i).first()).toBeVisible();
  });

  test("solicitação em análise aceita decisão e explica o bloqueio quando não aceita", async ({
    page,
  }) => {
    await page.goto("/admin/solicitacoes");

    const links = page.locator("a[href*='/admin/solicitacoes/']");
    const hrefs = [
      ...new Set(
        await links.evaluateAll((elementos) =>
          elementos.map((elemento) => elemento.getAttribute("href") ?? ""),
        ),
      ),
    ].filter(Boolean);

    expect(hrefs.length).toBeGreaterThan(0);

    let viuDecidivel = false;
    let viuBloqueio = false;

    for (const href of hrefs) {
      await page.goto(href);
      const select = page.locator("select[name=decisao]");

      if (!(await select.count())) continue;

      if (await select.isDisabled()) {
        // Bloqueio tem de explicar o motivo, nunca um genérico "Já analisada".
        await expect(
          page.getByText(/Sem ação individual|Decisão encerrada por votação/i),
        ).toBeVisible();
        viuBloqueio = true;
        continue;
      }

      const opcoes = await select.locator("option").allTextContents();
      expect(opcoes).toContain("Aprovar e publicar");
      viuDecidivel = true;
      break;
    }

    // A base de E2E precisa ter ao menos um dos dois cenários representados.
    expect(viuDecidivel || viuBloqueio).toBe(true);
  });

  test("filtros do catálogo respondem ao clique real", async ({ page }) => {
    await page.goto("/catalogo");

    const categoria = page.locator("fieldset input[name=categoria]").first();
    const valor = await categoria.getAttribute("value");

    // .check() falha se outro elemento interceptar o clique — exatamente o
    // sintoma do card com ::after sem ancestral posicionado.
    await categoria.check({ timeout: 8_000 });
    await expect(categoria).toBeChecked();

    await page.getByRole("button", { name: /Aplicar filtros/i }).click();
    await page.waitForURL(new RegExp(`categoria=${valor}`));

    await expect(page).toHaveURL(new RegExp(`categoria=${valor}`));
  });
});
