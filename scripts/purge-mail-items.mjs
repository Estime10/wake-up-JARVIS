#!/usr/bin/env node
/**
 * CLI purge mail_items (service_role).
 *
 *   pnpm mail:purge           → hors fenêtre (avant début de J-2)
 *   pnpm mail:purge --all     → tous les mail_items (+ mail_reads)
 *   pnpm mail:purge --user <uuid>
 *
 * Charge `.env.local` puis `.env` (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function startOfMailWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 2);
  return start;
}

function parseArgs(argv) {
  const all = argv.includes("--all");
  const userIdx = argv.indexOf("--user");
  const userId =
    userIdx >= 0 && argv[userIdx + 1] && !argv[userIdx + 1].startsWith("--")
      ? argv[userIdx + 1]
      : null;
  return { all, userId };
}

async function main() {
  const { all, userId } = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY (.env.local).",
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (all) {
    const { data, error } = await admin.rpc("admin_mail_items_purge_all", {
      p_user_id: userId,
    });
    if (error) {
      console.error("purge_all failed:", error.message);
      process.exit(1);
    }
    console.log(
      JSON.stringify({
        mode: "all",
        userId: userId ?? "all_users",
        deleted: data,
      }),
    );
    return;
  }

  if (!userId) {
    // Sans --user : purge hors fenêtre pour tous les users distincts.
    const { data: users, error: listError } = await admin
      .from("mail_items")
      .select("user_id");
    if (listError) {
      console.error("list users failed:", listError.message);
      process.exit(1);
    }
    const unique = [...new Set((users ?? []).map((row) => row.user_id))];
    const before = startOfMailWindow().toISOString();
    let total = 0;
    for (const id of unique) {
      const { data, error } = await admin.rpc("admin_mail_items_purge_before", {
        p_user_id: id,
        p_before: before,
      });
      if (error) {
        console.error(`purge_before failed for ${id}:`, error.message);
        process.exit(1);
      }
      total += Number(data ?? 0);
    }
    console.log(
      JSON.stringify({
        mode: "before_window",
        before,
        users: unique.length,
        deleted: total,
      }),
    );
    return;
  }

  const before = startOfMailWindow().toISOString();
  const { data, error } = await admin.rpc("admin_mail_items_purge_before", {
    p_user_id: userId,
    p_before: before,
  });
  if (error) {
    console.error("purge_before failed:", error.message);
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      mode: "before_window",
      userId,
      before,
      deleted: data,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
