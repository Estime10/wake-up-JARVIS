import { describe, expect, it } from "vitest";

import {
  pickPrimaryUserLabel,
  resolveMailLabelColor,
} from "@/features/mail/model/mailLabelColors";

describe("mailLabelColors", () => {
  it("prend le libellé user le plus profond", () => {
    expect(pickPrimaryUserLabel(["INBOX", "FACTURES/Orange", "UNREAD"])).toBe(
      "FACTURES/Orange",
    );
  });

  it("colore selon le dossier racine (toutes boîtes)", () => {
    expect(resolveMailLabelColor("FACTURES/Orange")).toBe("#ca8a04");
    expect(resolveMailLabelColor("ALERTES/Sécurité")).toBe("#e11d48");
    expect(resolveMailLabelColor("LINKEDIN/Offres")).toBe("#92400e");
    expect(resolveMailLabelColor("DEV/GitHub")).toBe("#7c3aed");
    expect(resolveMailLabelColor("SÉCURITÉ & COMPTES/Alertes")).toBe("#e11d48");
    expect(resolveMailLabelColor("RH & TRAVAIL/Paie")).toBe("#1d4ed8");
    expect(resolveMailLabelColor("DIVERS/À trier")).toBe("#a8a29e");
  });
});
