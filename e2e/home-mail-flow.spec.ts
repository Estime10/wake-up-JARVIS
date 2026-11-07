import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * CRASH TEST — accueil → home → liste mails → retirer une boîte.
 * Auth : E2E_EMAIL + E2E_PASSWORD, sinon OWNER_EMAILS + SUPABASE_SERVICE_ROLE_KEY
 * (verifyOtp → cookies SSR `tokens-only`, sans rotation MDP).
 */

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env) || !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const email =
  process.env.E2E_EMAIL?.trim() ||
  process.env.OWNER_EMAILS?.split(",")[0]?.trim() ||
  "";
const password = process.env.E2E_PASSWORD?.trim() ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";
const canPassword = email.length > 0 && password.length > 0;
const canMagic =
  email.length > 0 &&
  supabaseUrl.length > 0 &&
  serviceRole.length > 0 &&
  anonKey.length > 0;
const hasAuth = canPassword || canMagic;

type CookieJarEntry = {
  name: string;
  value: string;
  options?: {
    path?: string;
    sameSite?: string | boolean;
    httpOnly?: boolean;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
  };
};

async function loginWithPassword(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/^e-?mail$/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

async function loginWithAdminSession(page: Page): Promise<void> {
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties?.hashed_token) {
    throw new Error(
      `generateLink: ${error?.message ?? "hashed_token manquant"}`,
    );
  }

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const verified = await anon.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "email",
  });
  if (verified.error || !verified.data.session) {
    throw new Error(
      `verifyOtp: ${verified.error?.message ?? "session absente"}`,
    );
  }

  let jar: CookieJarEntry[] = [];
  const ssr = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => jar.map(({ name, value }) => ({ name, value })),
      setAll: (cookies: CookieJarEntry[]) => {
        for (const cookie of cookies) {
          jar = jar.filter((entry) => entry.name !== cookie.name);
          if (cookie.value) {
            jar.push(cookie);
          }
        }
      },
      encode: "tokens-only",
    },
  });

  const { error: setError } = await ssr.auth.setSession({
    access_token: verified.data.session.access_token,
    refresh_token: verified.data.session.refresh_token,
  });
  if (setError) {
    throw new Error(`setSession: ${setError.message}`);
  }
  if (jar.length === 0) {
    throw new Error("aucun cookie auth écrit");
  }

  await page.context().addCookies(
    jar.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: "127.0.0.1",
      path: cookie.options?.path ?? "/",
      httpOnly: cookie.options?.httpOnly ?? false,
      secure: false,
      sameSite: "Lax" as const,
    })),
  );

  await page.goto("/home");
  await expect(page).toHaveURL(/\/home/, { timeout: 30_000 });
}

/** Attend composer éditable (boot + settle terminés). */
async function waitComposerReady(page: Page): Promise<void> {
  await expect(page.locator("[data-boot-scan]")).toHaveCount(0, {
    timeout: 60_000,
  });
  const composer = page.locator("#composer");
  await expect
    .poll(
      async () => {
        const disabled = await composer.getAttribute("aria-disabled");
        const readonly = await composer.getAttribute("readonly");
        const box = await composer.boundingBox();
        const opacity = await composer.evaluate((el) => {
          const wrap = el.closest("[data-home='composer']") ?? el;
          return window.getComputedStyle(wrap).opacity;
        });
        return (
          disabled === null &&
          readonly === null &&
          box !== null &&
          Number(opacity) > 0.5
        );
      },
      { timeout: 90_000, message: "composer non prêt (boot/settle)" },
    )
    .toBe(true);
}

test.describe("CRASH — home / mails / disconnect", () => {
  test.skip(
    !hasAuth,
    "E2E_EMAIL/PASSWORD ou OWNER_EMAILS+SERVICE_ROLE absents",
  );

  test("accueil → home → liste mails → retirer boîte", async ({ page }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.addInitScript(() => {
      if (window.speechSynthesis) {
        window.speechSynthesis.speak = (utterance) => {
          window.setTimeout(() => {
            utterance.dispatchEvent(new Event("end"));
          }, 30);
        };
      }
    });

    if (canPassword) {
      await loginWithPassword(page);
    } else {
      await loginWithAdminSession(page);
    }

    await expect(page).toHaveURL(/\/home/);
    await page.mouse.click(24, 24);
    await waitComposerReady(page);

    const composer = page.locator("#composer");
    await composer.click();
    await composer.fill("liste mes mails");
    await composer.press("Enter");

    await expect(
      page
        .getByText(/titres seulement|liste de tes mails|aucun mail|boîte/i)
        .first(),
    ).toBeVisible({ timeout: 90_000 });

    await page.getByRole("button", { name: /ouvrir les mails/i }).click();

    const retirer = page.getByRole("button", { name: /^retirer$/i });
    await expect(retirer.first()).toBeVisible({ timeout: 20_000 });
    const before = await retirer.count();
    await retirer.first().click();
    await expect
      .poll(async () => retirer.count(), { timeout: 20_000 })
      .toBeLessThan(before);
  });
});
