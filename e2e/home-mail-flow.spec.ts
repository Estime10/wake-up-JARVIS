import { expect, test } from "@playwright/test";

/**
 * CRASH TEST — parcours accueil → login/home → assistant mails → disconnect.
 * Requiert E2E_EMAIL + E2E_PASSWORD (session réelle). Sinon skip explicite.
 */
const email = process.env.E2E_EMAIL?.trim() ?? "";
const password = process.env.E2E_PASSWORD?.trim() ?? "";
const hasCreds = email.length > 0 && password.length > 0;

test.describe("CRASH — home / mails / disconnect", () => {
  test.skip(!hasCreds, "E2E_EMAIL / E2E_PASSWORD absents");

  test("accueil → home → liste mails → disconnect boîte", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(login|home)?/);

    // Splash / gate → login
    if (
      page.url().includes("/login") ||
      (await page.getByLabel(/e-?mail/i).count()) > 0
    ) {
      await page.goto("/login");
      await page.getByLabel(/e-?mail/i).fill(email);
      await page.getByLabel(/mot de passe|password/i).fill(password);
      await page
        .getByRole("button", { name: /connexion|se connecter|login/i })
        .click();
    }

    await page.waitForURL(/\/home/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/home/);

    // Composer / assistant — liste des mails
    const composer = page.getByRole("textbox").first();
    await composer.fill("liste mes mails");
    await composer.press("Enter");

    await expect(
      page.getByText(/liste|mails|titres|aucun|boîte|pas de nouveau/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    // Panneau mail / comptes — tenter disconnect
    const disconnect = page.getByRole("button", {
      name: /déconnecter|disconnect|révoquer/i,
    });
    if ((await disconnect.count()) > 0) {
      await disconnect.first().click();
      await expect(
        page.getByText(/déconnect|révoqu|plus de compte|connecter/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Aucune boîte connectée — disconnect non exercé",
      });
    }
  });
});
