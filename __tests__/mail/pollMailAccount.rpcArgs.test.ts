import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const fromSelect = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc,
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => fromSelect(),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/google/refreshAccessToken", () => ({
  refreshGoogleAccessToken: vi.fn(async () => ({
    ok: false,
    reason: "invalid_grant",
  })),
}));

vi.mock("@/lib/google/gmail", () => ({
  listGmailMessagesByQuery: vi.fn(),
  fetchGmailLabelNames: vi.fn(),
  fetchGmailProfileHistoryId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("pollMailAccount RPC args (H1/H2)", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockImplementation(async (name: string) => {
      if (name === "admin_mail_account_read_token") {
        return { data: "refresh-token", error: null };
      }
      if (name === "admin_mail_account_set_status") {
        return { error: null };
      }
      return { error: null };
    });
  });

  it("n’appelle plus de purge", async () => {
    const { pollMailAccount } =
      await import("@/features/mail/services/pollMailAccount");

    await pollMailAccount(
      {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "22222222-2222-4222-8222-222222222222",
        gmail_history_id: null,
        status: "active",
      },
      [],
    );

    expect(
      rpc.mock.calls.some(([name]) => String(name).includes("purge")),
    ).toBe(false);
  });

  it("lit le jeton avec (p_user_id, p_account_id) — jamais p_secret_id", async () => {
    const { pollMailAccount } =
      await import("@/features/mail/services/pollMailAccount");

    await pollMailAccount(
      {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "22222222-2222-4222-8222-222222222222",
        gmail_history_id: null,
        status: "active",
      },
      [],
    );

    const readCall = rpc.mock.calls.find(
      ([name]) => name === "admin_mail_account_read_token",
    );
    expect(readCall).toBeDefined();
    expect(readCall?.[1]).toEqual({
      p_user_id: "22222222-2222-4222-8222-222222222222",
      p_account_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(readCall?.[1]).not.toHaveProperty("p_secret_id");

    const upsertCalls = rpc.mock.calls.filter(
      ([name]) => name === "admin_mail_item_upsert",
    );
    for (const [, args] of upsertCalls) {
      expect(args).not.toHaveProperty("p_snippet");
    }
  });
});
