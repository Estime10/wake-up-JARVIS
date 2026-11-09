import { invoke } from "@tauri-apps/api/core";

export type TerminalRunOk = {
  cwd: string;
  lines: string[];
  clear: boolean;
};

export async function terminalHomeViaTauri(): Promise<string> {
  return invoke<string>("terminal_home");
}

export async function terminalRunViaTauri(
  cwd: string,
  line: string,
): Promise<TerminalRunOk> {
  return invoke<TerminalRunOk>("terminal_run", { cwd, line });
}
