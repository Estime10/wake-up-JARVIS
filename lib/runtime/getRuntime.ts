import { isTauri } from "@/lib/runtime/isTauri";

export type AppRuntime = "web" | "tauri";

export function getRuntime(): AppRuntime {
  return isTauri() ? "tauri" : "web";
}
