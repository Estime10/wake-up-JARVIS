import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "22222222-2222-4222-8222-222222222222" } },
      }),
    },
    from: () => ({
      select: () => ({
        maybeSingle,
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

vi.mock("@/lib/github/user", () => ({
  fetchGithubUser: vi.fn(async () => ({
    ok: true as const,
    user: { id: 1, login: "devin" },
  })),
}));

describe("loadGithubConnectionToken RPC args (H1)", () => {
  beforeEach(() => {
    rpc.mockReset();
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValue({
      data: {
        id: "33333333-3333-4333-8333-333333333333",
        github_login: "devin",
        status: "active",
        expires_at: null,
      },
      error: null,
    });
    rpc.mockResolvedValue({ data: "ghp_test", error: null });
  });

  it("appelle read_token avec (p_user_id, p_connection_id)", async () => {
    const { loadGithubConnectionToken } =
      await import("@/lib/github/connectionToken");

    const result = await loadGithubConnectionToken();
    expect(result.ok).toBe(true);

    expect(rpc).toHaveBeenCalledWith("admin_github_connection_read_token", {
      p_user_id: "22222222-2222-4222-8222-222222222222",
      p_connection_id: "33333333-3333-4333-8333-333333333333",
    });
    const [, args] = rpc.mock.calls[0] ?? [];
    expect(args).not.toHaveProperty("p_secret_id");
  });
});
