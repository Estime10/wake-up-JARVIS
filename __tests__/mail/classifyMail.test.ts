import { describe, expect, it } from "vitest";

import {
  classifyMail,
  DEFAULT_MAIL_CATEGORY,
} from "@/features/mail/model/classifyMail";
import type { MailRule } from "@/features/mail/model/mailRule";

const RULES: MailRule[] = [
  {
    matchType: "sender",
    pattern: "github.com",
    category: "DEV/GitHub",
    priority: 10,
  },
  {
    matchType: "sender",
    pattern: "stripe",
    category: "FINANCE/Stripe",
    priority: 20,
  },
  {
    matchType: "subject",
    pattern: "facture",
    category: "FINANCE/Factures",
    priority: 10,
  },
];

describe("classifyMail", () => {
  it("priorise l’expéditeur sur l’objet", () => {
    expect(
      classifyMail(
        { fromRaw: "noreply@github.com", subject: "facture mars" },
        RULES,
      ),
    ).toBe("DEV/GitHub");
  });

  it("utilise l’objet si pas d’expéditeur", () => {
    expect(
      classifyMail(
        { fromRaw: "compta@example.com", subject: "Facture #12" },
        RULES,
      ),
    ).toBe("FINANCE/Factures");
  });

  it("fallback DIVERS", () => {
    expect(classifyMail({ fromRaw: "a@b.com", subject: "salut" }, RULES)).toBe(
      DEFAULT_MAIL_CATEGORY,
    );
  });

  it("est déterministe", () => {
    const input = { fromRaw: "billing@stripe.com", subject: "Receipt" };
    expect(classifyMail(input, RULES)).toBe(classifyMail(input, RULES));
  });

  it("traite les métacaractères littéralement", () => {
    expect(
      classifyMail({ fromRaw: "a@b.com", subject: "prix = 10" }, [
        {
          matchType: "subject",
          pattern: "prix.*",
          category: "X",
          priority: 1,
        },
      ]),
    ).toBe(DEFAULT_MAIL_CATEGORY);
    expect(
      classifyMail({ fromRaw: "a@b.com", subject: "promo prix.*" }, [
        {
          matchType: "subject",
          pattern: "prix.*",
          category: "X",
          priority: 1,
        },
      ]),
    ).toBe("X");
  });
});
