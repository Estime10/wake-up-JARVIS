import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const revokeGoogleToken = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock("@/lib/auth/requireOwnerAccess", () => ({
  requireOwnerAccess: vi.fn(async () => ({
    ok: true as const,
    user: { id: "22222222-2222-4222-8222-222222222222" },
  })),
}));

vi.mock("@/lib/auth/ownerAccessResponse", () => ({
  ownerAccessDeniedResponse: vi.fn(),
}));

vi.mock("@/lib/google/oauth", () => ({
  revokeGoogleToken: (...args: unknown[]) => revokeGoogleToken(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  })),
}));

describe("POST /api/google/oauth/disconnect (DEV-1)", () => {
  beforeEach(() => {
    rpc.mockReset();
    revokeGoogleToken.mockReset();
    maybeSingleMock.mockReset();
    maybeSingleMock.mockResolvedValue({
      data: { id: "11111111-1111-4111-8111-111111111111" },
      error: null,
    });
    rpc.mockImplementation(async (name: string) => {
      if (name === "admin_mail_account_read_token") {
        return { data: "refresh-token", error: null };
      }
      if (name === "admin_mail_account_delete") {
        return { data: "33333333-3333-4333-8333-333333333333", error: null };
      }
      return { data: null, error: null };
    });
    revokeGoogleToken.mockResolvedValue(undefined);
  });

  it("purge locale avant révocation Google", async () => {
    const { POST } = await import("@/app/api/google/oauth/disconnect/route");
    const order: string[] = [];

    rpc.mockImplementation(async (name: string) => {
      order.push(String(name));
      if (name === "admin_mail_account_read_token") {
        return { data: "refresh-token", error: null };
      }
      if (name === "admin_mail_account_delete") {
        return { data: "33333333-3333-4333-8333-333333333333", error: null };
      }
      return { data: null, error: null };
    });
    revokeGoogleToken.mockImplementation(async () => {
      order.push("revokeGoogleToken");
    });

    const response = await POST(
      new NextRequest("http://localhost/api/google/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(order).toEqual([
      "admin_mail_account_read_token",
      "admin_mail_account_delete",
      "revokeGoogleToken",
    ]);
  });

  it("n’appelle pas revoke si la purge échoue", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "admin_mail_account_read_token") {
        return { data: "refresh-token", error: null };
      }
      if (name === "admin_mail_account_delete") {
        return {
          data: null,
          error: { message: "mail_reads_delete_forbidden" },
        };
      }
      return { data: null, error: null };
    });

    const { POST } = await import("@/app/api/google/oauth/disconnect/route");
    const response = await POST(
      new NextRequest("http://localhost/api/google/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(revokeGoogleToken).not.toHaveBeenCalled();
  });
});
