import "server-only";

import { spawnSync } from "node:child_process";

export type MacCommandResult = {
  ok: boolean;
  stdout: string;
  error: string;
};

/** Exécute une commande locale courte (pmset / osascript). */
export function runMacCommand(
  cmd: string,
  args: string[],
  timeoutMs = 3000,
): MacCommandResult {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) {
    return { ok: false, stdout: "", error: result.error.message };
  }
  if (result.status !== 0 && !(result.stdout || "").trim()) {
    return {
      ok: false,
      stdout: "",
      error: (result.stderr || "").trim() || `exit_${result.status ?? "?"}`,
    };
  }
  return { ok: true, stdout: result.stdout || "", error: "" };
}
