import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export async function terminalPtyStart(
  cols: number,
  rows: number,
): Promise<void> {
  await invoke("terminal_pty_start", { cols, rows });
}

export async function terminalPtyStop(): Promise<void> {
  await invoke("terminal_pty_stop");
}

export async function terminalPtyWrite(data: string): Promise<void> {
  await invoke("terminal_pty_write", { data });
}

export async function terminalPtyResize(
  cols: number,
  rows: number,
): Promise<void> {
  await invoke("terminal_pty_resize", { cols, rows });
}

export async function listenTerminalPtyData(
  onData: (chunk: string) => void,
): Promise<UnlistenFn> {
  return listen<string>("terminal-pty-data", (event) => {
    onData(event.payload);
  });
}

export async function listenTerminalPtyExit(
  onExit: () => void,
): Promise<UnlistenFn> {
  return listen("terminal-pty-exit", () => {
    onExit();
  });
}
