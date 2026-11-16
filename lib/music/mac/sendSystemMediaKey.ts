import "server-only";

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import type { MusicTransportAction } from "@/lib/music/musicTransportAction";

const DIR = join(process.cwd(), "lib/music/mac");
const SOURCE = join(DIR, "sendSystemMediaKey.swift");
const BINARY = join(DIR, ".sendSystemMediaKey");

/**
 * Envoie une touche média système (play/pause, next, previous)
 * — même canal que les touches clavier, sans focus d'app.
 */
export function sendSystemMediaKey(action: MusicTransportAction): boolean {
  if (process.platform !== "darwin") {
    return false;
  }
  const bin = ensureBinary();
  if (!bin) {
    return false;
  }
  const arg =
    action === "toggle" ? "toggle" : action === "next" ? "next" : "previous";
  const result = spawnSync(bin, [arg], {
    encoding: "utf8",
    timeout: 3000,
  });
  return result.status === 0 && (result.stdout || "").includes("ok");
}

function ensureBinary(): string | null {
  if (!existsSync(SOURCE)) {
    return null;
  }
  const needsBuild =
    !existsSync(BINARY) || statSync(SOURCE).mtimeMs > statSync(BINARY).mtimeMs;
  if (!needsBuild) {
    return BINARY;
  }
  const compiled = spawnSync(
    "swiftc",
    [SOURCE, "-framework", "Cocoa", "-o", BINARY],
    { encoding: "utf8", timeout: 60_000 },
  );
  if (compiled.status !== 0 || !existsSync(BINARY)) {
    return null;
  }
  return BINARY;
}
