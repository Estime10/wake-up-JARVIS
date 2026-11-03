import { describe, expect, it } from "vitest";

import { mailMatchesLabel } from "@/features/mail/model/mailMatchesLabel";

describe("mailMatchesLabel", () => {
  it("matche égalité et préfixe chemin", () => {
    expect(mailMatchesLabel("DEV", "dev")).toBe(true);
    expect(mailMatchesLabel("DEV/GitHub", "DEV")).toBe(true);
  });

  it("matche le dossier racine", () => {
    expect(mailMatchesLabel("DEV/Projets/Jarvis", "DEV")).toBe(true);
  });

  it("matche TECH & DEV quand on demande DEV", () => {
    expect(mailMatchesLabel("TECH & DEV", "DEV")).toBe(true);
    expect(mailMatchesLabel("TECH & DEV/GitHub", "DEV")).toBe(true);
  });

  it("ne matche pas un label sans le token", () => {
    expect(mailMatchesLabel("LINKEDIN/Offres", "DEV")).toBe(false);
  });

  it("rejette catégorie absente", () => {
    expect(mailMatchesLabel(undefined, "DEV")).toBe(false);
    expect(mailMatchesLabel("DEV", "")).toBe(false);
  });
});
