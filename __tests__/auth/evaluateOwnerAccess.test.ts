import { describe, expect, it } from "vitest";

import { evaluateOwnerAccess } from "@/lib/auth/evaluateOwnerAccess";
import { parseOwnerEmails } from "@/lib/auth/ownerEmails";

describe("parseOwnerEmails", () => {
  it("parse un CSV valide", () => {
    expect(parseOwnerEmails("a@example.com, B@Example.com")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("échoue fermé si vide ou invalide", () => {
    expect(parseOwnerEmails(undefined)).toEqual([]);
    expect(parseOwnerEmails("")).toEqual([]);
    expect(parseOwnerEmails("not-an-email")).toEqual([]);
  });
});

describe("evaluateOwnerAccess", () => {
  const owners = ["owner@example.com"] as const;

  it("401 sans user", () => {
    expect(evaluateOwnerAccess({ user: null, ownerEmails: owners })).toEqual({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
  });

  it("403 hors allowlist", () => {
    expect(
      evaluateOwnerAccess({
        user: { id: "u1", email: "other@example.com" },
        ownerEmails: owners,
      }),
    ).toEqual({ ok: false, status: 403, error: "forbidden_owner" });
  });

  it("ok propriétaire allowlisté", () => {
    expect(
      evaluateOwnerAccess({
        user: { id: "u1", email: "Owner@Example.com" },
        ownerEmails: owners,
      }),
    ).toEqual({ ok: true });
  });
});
