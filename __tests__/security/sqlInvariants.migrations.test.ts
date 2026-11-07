import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function readMigration(name: string): string {
  return readFileSync(resolve(root, "supabase/migrations", name), "utf8");
}

describe("SQL invariants (DEV-16 — file-level CI)", () => {
  it("DEV-1 : mail_reads SET NULL présent", () => {
    const sql = readMigration("20261104173000_mail_reads_fk_set_null.sql");
    expect(sql).toMatch(/on delete set null/i);
  });

  it("DEV-11 / DEV-14 : revoke EXECUTE private + limite platform", () => {
    const revoke = readMigration(
      "20261104176000_private_revoke_execute_and_platform_limit.sql",
    );
    expect(revoke).toMatch(/revoke all on function/i);
    expect(revoke).toMatch(/nspname = 'private'/);
    expect(revoke).toMatch(/supabase_platform_connection_limit/);
    expect(revoke).toMatch(/v_count >= 5/);
  });

  it("DEV-6 : garde needs_reauth dans set_status", () => {
    const sql = readMigration(
      "20261104175000_mail_account_status_reauth_guard.sql",
    );
    expect(sql).toContain("mail_account_needs_reauth");
  });

  it("DEV-2 extension : garde vs.name platform Vault", () => {
    const sql = readMigration(
      "20261104178000_platform_vault_secret_name_guard.sql",
    );
    expect(sql).toContain("supabase_platform_' || spc.id::text");
    expect(sql).toMatch(/vs\.name = 'supabase_platform_'/);
  });
});
