import { expect, test } from "@playwright/test";

const shouldRun = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

test.describe("FluxoAdvogado - login e listagem", () => {
  test.skip(!shouldRun, "Defina E2E_EMAIL e E2E_PASSWORD para executar os testes E2E.");

  test("usuario acessa listagem de demandas apos login", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-mail").fill(process.env.E2E_EMAIL ?? "");
    await page.getByLabel("Senha").fill(process.env.E2E_PASSWORD ?? "");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/#\/demandas/);
    await expect(page.getByRole("heading", { name: "Listagem geral de demandas" })).toBeVisible();
  });
});
