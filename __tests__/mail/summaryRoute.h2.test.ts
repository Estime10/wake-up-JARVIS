import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const maybeSingleMock = vi.fn();
const adminMaybeSingle = vi.fn();

vi.mock("@/lib/auth/requireOwnerAccess", () => ({
  requireOwnerAccess: vi.fn(),
}));

vi.mock("@/lib/google/env", () => ({
  hasGoogleOAuthEnv: () => true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseServiceRole: () => true,
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: adminMaybeSingle,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
      insert: insertMock,
    }),
  })),
}));

import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";

describe("POST /api/mail/items/[id]/summary (H2/M6)", () => {
  beforeEach(() => {
    vi.mocked(requireOwnerAccess).mockResolvedValue({
      ok: true,
      user: { id: "u1", email: "owner@example.com" } as never,
    });
    insertMock.mockReset();
    maybeSingleMock.mockReset();
    adminMaybeSingle.mockReset();
    insertMock.mockResolvedValue({ error: null });
    maybeSingleMock.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        account_id: "22222222-2222-4222-8222-222222222222",
      },
      error: null,
    });
    adminMaybeSingle.mockResolvedValue({
      data: { id: "22222222-2222-4222-8222-222222222222", status: "active" },
      error: null,
    });
  });

  it("répond 501 après journal, sans Gmail", async () => {
    const { POST } = await import("@/app/api/mail/items/[id]/summary/route");

    const request = new Request("http://localhost/api/mail/items/x/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true }),
    });

    const response = await POST(request as never, {
      params: Promise.resolve({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    });

    expect(insertMock).toHaveBeenCalled();
    expect(response.status).toBe(501);
  });

  it("refuse un id non-uuid (400) sans requête base", async () => {
    const { POST } = await import("@/app/api/mail/items/[id]/summary/route");

    const response = await POST(
      new Request("http://localhost/api/mail/items/x/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      }) as never,
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );

    expect(response.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("500 si journal en erreur", async () => {
    insertMock.mockResolvedValue({ error: { message: "fail" } });
    const { POST } = await import("@/app/api/mail/items/[id]/summary/route");

    const response = await POST(
      new Request("http://localhost/api/mail/items/x/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      }) as never,
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(500);
  });
});
