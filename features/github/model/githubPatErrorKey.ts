import type { MessageKey } from "@/lib/i18n";

const ERROR_MAP: Record<string, MessageKey> = {
  unauthorized: "home.repoPatErrorUnauthorized",
  forbidden: "home.repoPatErrorForbidden",
  body: "home.repoPatErrorBody",
  store: "home.repoPatErrorStore",
  network: "home.repoPatErrorNetwork",
  upstream: "home.repoPatErrorUpstream",
  config: "home.repoPatErrorConfig",
  auth: "home.repoPatErrorAuth",
};

/** Map code API → clé i18n (jamais le PAT). */
export function githubPatErrorKey(code: string | undefined): MessageKey {
  if (!code) {
    return "home.repoPatErrorUpstream";
  }
  return ERROR_MAP[code] ?? "home.repoPatErrorUpstream";
}
