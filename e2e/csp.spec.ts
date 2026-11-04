import { expect, test } from "@playwright/test";

test.describe("CSP", () => {
  test("aucune erreur CSP sur / (Chromium + WebKit)", async ({ page }) => {
    const cspViolations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("Content Security Policy") ||
        text.includes("Content-Security-Policy")
      ) {
        cspViolations.push(text);
      }
    });
    page.on("pageerror", (error) => {
      if (error.message.includes("Content Security Policy")) {
        cspViolations.push(error.message);
      }
    });

    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);

    const csp = response?.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src");
    expect(csp).toContain("nonce-");
    expect(csp).toContain("https://api.bigdatacloud.net");

    await page.waitForTimeout(500);
    expect(cspViolations).toEqual([]);
  });
});
