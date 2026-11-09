#!/usr/bin/env node
/**
 * beforeDevCommand Tauri : réutilise Next sur :3000 s’il tourne déjà,
 * sinon lance `pnpm dev` (process long-lived).
 */
import { spawn } from "node:child_process";
import net from "node:net";

const PORT = 3000;
/** Aligné sur `tauri.conf.json` → `devUrl` (cookies / HMR = même host que Next). */
const HOST = "localhost";

function portOpen() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host: HOST }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

if (await portOpen()) {
  console.log(
    `[tauri] Next déjà actif sur http://${HOST}:${PORT} — pas de second serveur.`,
  );
  process.exit(0);
}

const child = spawn("pnpm", ["dev"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
